import { useState, useEffect, useRef } from 'react'
import { FileText, ChevronRight, ChevronLeft, Download, Check, Loader2, Search, Users, Eye, CheckCircle, Clock, AlertTriangle, X, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'
import Modal from '../../components/ui/Modal'

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  const startDraw = (e) => {
    e.preventDefault()
    setDrawing(true)
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    if (!drawing) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDraw = () => {
    setDrawing(false)
    if (canvasRef.current) onChange(canvasRef.current.toDataURL())
  }

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    onChange('')
  }

  return (
    <div>
      <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={460}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-3 left-4 right-4 border-t border-gray-300 pointer-events-none" />
        <p className="absolute bottom-1 left-4 text-[9px] text-gray-300 pointer-events-none">Sign here</p>
      </div>
      {value && (
        <button onClick={clear} className="mt-2 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium">
          <Trash2 size={12} /> Clear signature
        </button>
      )}
    </div>
  )
}

const DOC_TYPE_LABELS = {
  service_agreement: 'Service Agreement',
  ndis_plan: 'NDIS Plan',
  risk_assessment: 'Risk Assessment',
  consent_form: 'Consent Form',
  medical_report: 'Medical Report',
  behaviour_support_plan: 'Behaviour Support Plan',
  support_plan: 'Support Plan',
  other: 'Other',
}

const DOC_TYPE_COLORS = {
  service_agreement: 'from-blue-500 to-indigo-500',
  ndis_plan: 'from-emerald-500 to-teal-500',
  risk_assessment: 'from-amber-500 to-orange-500',
  consent_form: 'from-violet-500 to-purple-500',
  medical_report: 'from-red-500 to-rose-500',
  behaviour_support_plan: 'from-pink-500 to-rose-500',
  support_plan: 'from-cyan-500 to-blue-500',
  other: 'from-gray-500 to-gray-600',
}

export default function StaffParticipantDocs() {
  const { staffProfile, myShifts } = useStaff()
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [documents, setDocuments] = useState([])
  const [signoffs, setSignoffs] = useState({})
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [signing, setSigning] = useState(false)
  const [search, setSearch] = useState('')
  const [signModal, setSignModal] = useState(null) // document id to sign
  const [signature, setSignature] = useState('')

  // Get unique participant IDs from shifts
  useEffect(() => {
    async function loadParticipants() {
      try {
        const participantIds = [...new Set(myShifts.filter(s => s.participant_id || s.participants?.id).map(s => s.participant_id || s.participants?.id).filter(Boolean))]
        
        if (participantIds.length === 0) {
          setParticipants([])
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('participants')
          .select('id, first_name, last_name, ndis_number, status, address')
          .in('id', participantIds)
          .order('first_name', { ascending: true })
        
        setParticipants(data || [])
      } catch (err) {
        console.error('Load participants error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadParticipants()
  }, [myShifts])

  const loadDocuments = async (participantId) => {
    setLoadingDocs(true)
    try {
      const { data: allDocs, error: docsErr } = await supabase
        .from('documents')
        .select('*')
        .eq('participant_id', participantId)
      
      if (docsErr) {
        console.error('Documents query error:', docsErr)
        setDocuments([])
        setLoadingDocs(false)
        return
      }
      
      // Filter: show if visible_to_staff is true or null/undefined (default visible)
      const docs = (allDocs || []).filter(d => d.visible_to_staff !== false)
      
      // Filter by staff access: if document_staff_access rows exist for a doc,
      // only show if this staff is in the list. If no rows, show to all assigned staff.
      let filteredDocs = docs || []
      if (staffProfile?.id && filteredDocs.length > 0) {
        try {
          const docIds = filteredDocs.map(d => d.id)
          const { data: accessRows, error: accessErr } = await supabase
            .from('document_staff_access')
            .select('document_id, staff_id')
            .in('document_id', docIds)
          
          if (!accessErr && accessRows && accessRows.length > 0) {
            const accessByDoc = {}
            accessRows.forEach(r => {
              if (!accessByDoc[r.document_id]) accessByDoc[r.document_id] = new Set()
              accessByDoc[r.document_id].add(r.staff_id)
            })
            filteredDocs = filteredDocs.filter(d => {
              if (!accessByDoc[d.id]) return true
              return accessByDoc[d.id].has(staffProfile.id)
            })
          }
        } catch (accessErr) {
          console.warn('document_staff_access table may not exist yet, showing all visible docs')
        }
      }

      setDocuments(filteredDocs)

      // Load signoffs for this staff member
      if (staffProfile?.id && filteredDocs.length > 0) {
        try {
          const docIds = filteredDocs.map(d => d.id)
          const { data: sigs, error: sigErr } = await supabase
            .from('document_signoffs')
            .select('*')
            .eq('staff_id', staffProfile.id)
            .in('document_id', docIds)
          
          if (!sigErr) {
            const sigMap = {}
            ;(sigs || []).forEach(s => { sigMap[s.document_id] = s })
            setSignoffs(sigMap)
          }
        } catch (sigErr) {
          console.warn('document_signoffs table may not exist yet')
        }
      } else {
        setSignoffs({})
      }
    } catch (err) {
      console.error('Load docs error:', err)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleSelectParticipant = (p) => {
    setSelectedParticipant(p)
    loadDocuments(p.id)
  }

  const openSignModal = (docId) => {
    setSignature('')
    setSignModal(docId)
  }

  const handleSignOff = async () => {
    if (!staffProfile?.id || !signModal) return
    if (!signature) { alert('Please sign before submitting'); return }
    setSigning(true)
    try {
      const { error } = await supabase.from('document_signoffs').insert({
        document_id: signModal,
        staff_id: staffProfile.id,
        signature_data: signature,
      })
      if (error) throw error
      setSignoffs(prev => ({ ...prev, [signModal]: { document_id: signModal, staff_id: staffProfile.id, signed_at: new Date().toISOString(), signature_data: signature } }))
      setSignModal(null)
      setSignature('')
      setViewDoc(null)
    } catch (err) {
      if (err.message?.includes('duplicate')) {
        alert('You have already signed off on this document')
      } else {
        console.error('Sign off error:', err)
        alert('Failed to sign off: ' + (err.message || 'Unknown error'))
      }
    } finally {
      setSigning(false)
    }
  }

  const filtered = participants.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.ndis_number || '').toLowerCase().includes(q)
  })

  const needsSignoff = documents.filter(d => d.requires_signoff && !signoffs[d.id])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
  }

  // Document list view for selected participant
  if (selectedParticipant) {
    return (
      <div className="space-y-5">
        {/* Back + header */}
        <div>
          <button onClick={() => { setSelectedParticipant(null); setDocuments([]); setSignoffs({}) }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium mb-3">
            <ChevronLeft size={16} /> Back to Participants
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg text-white text-xl font-black">
              {selectedParticipant.first_name?.[0]}{selectedParticipant.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{selectedParticipant.first_name} {selectedParticipant.last_name}</h2>
              <p className="text-sm text-gray-500">
                {selectedParticipant.ndis_number && `NDIS: ${selectedParticipant.ndis_number} · `}
                {documents.length} document{documents.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Signoff alert */}
        {needsSignoff.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 text-sm">{needsSignoff.length} document{needsSignoff.length !== 1 ? 's' : ''} require your acknowledgement</p>
                <p className="text-xs text-gray-500">Please review and sign off on the highlighted documents below</p>
              </div>
            </div>
          </div>
        )}

        {loadingDocs ? (
          <div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map(doc => {
              const signed = !!signoffs[doc.id]
              const needsSign = doc.requires_signoff && !signed
              const color = DOC_TYPE_COLORS[doc.document_type] || 'from-gray-500 to-gray-600'
              const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type?.replace(/_/g, ' ') || 'Document'

              return (
                <div key={doc.id} className={`p-4 rounded-2xl bg-white/80 border backdrop-blur-sm transition-all ${needsSign ? 'border-amber-300 shadow-md shadow-amber-100' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-[15px]">{doc.name || 'Untitled'}</p>
                        {needsSign && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider flex items-center gap-0.5">
                            <Clock size={8} /> Sign Required
                          </span>
                        )}
                        {signed && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider flex items-center gap-0.5">
                            <Check size={8} /> Signed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {label}
                        {doc.expiry_date && ` · Expires: ${new Date(doc.expiry_date).toLocaleDateString('en-AU')}`}
                        {doc.created_at && ` · Added: ${new Date(doc.created_at).toLocaleDateString('en-AU')}`}
                      </p>
                      {signed && signoffs[doc.id]?.signed_at && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          Acknowledged {new Date(signoffs[doc.id].signed_at).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.file_url && (
                        <button onClick={() => setViewDoc(doc)}
                          className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors" title="View">
                          <Eye size={16} className="text-blue-600" />
                        </button>
                      )}
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors" title="Download">
                          <Download size={16} className="text-gray-600" />
                        </a>
                      )}
                      {needsSign && (
                        <button onClick={() => openSignModal(doc.id)} disabled={signing}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white text-xs font-bold shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all hover:shadow-xl">
                          <CheckCircle size={14} />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-white/80 border border-gray-200 text-center backdrop-blur-sm">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-800">No documents available</p>
            <p className="text-sm text-gray-400 mt-1">Documents shared by admin will appear here</p>
          </div>
        )}

        {/* Document Viewer Modal */}
        <Modal isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.name || 'Document'} wide>
          {viewDoc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${DOC_TYPE_COLORS[viewDoc.document_type] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow`}>
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{viewDoc.name}</p>
                    <p className="text-[10px] text-gray-400">{DOC_TYPE_LABELS[viewDoc.document_type] || viewDoc.document_type}</p>
                  </div>
                </div>
                <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-semibold transition-colors">
                  <Download size={12} /> Download
                </a>
              </div>

              {viewDoc.file_url?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={viewDoc.file_url} className="w-full border-0 rounded-xl" style={{ height: '500px' }} title="Document viewer" />
              ) : viewDoc.file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={viewDoc.file_url} alt={viewDoc.name} className="w-full rounded-xl border border-gray-200" />
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                  <FileText size={40} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Document Preview Not Available</p>
                  <p className="text-xs text-gray-400 mt-1">Click Download to view this document</p>
                </div>
              )}

              {/* Sign-off button in viewer */}
              {viewDoc.requires_signoff && !signoffs[viewDoc.id] && (
                <button onClick={() => openSignModal(viewDoc.id)} disabled={signing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  I acknowledge I have read this document — Sign Now
                </button>
              )}
              {viewDoc.requires_signoff && signoffs[viewDoc.id] && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <p className="text-sm text-emerald-700 font-semibold">Acknowledged {new Date(signoffs[viewDoc.id].signed_at).toLocaleDateString('en-AU')}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Signature Modal */}
        <Modal isOpen={!!signModal} onClose={() => { setSignModal(null); setSignature('') }} title="Acknowledge Document">
          {signModal && (() => {
            const doc = documents.find(d => d.id === signModal)
            return (
              <div className="space-y-5">
                {doc && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="font-bold text-gray-800 text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 font-semibold">Declaration</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    I, <strong>{staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : 'Staff Member'}</strong>, confirm that I have read, understood, and acknowledge the contents of this document. I understand my responsibilities as outlined within.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Signature</p>
                  <SignaturePad value={signature} onChange={setSignature} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setSignModal(null); setSignature('') }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSignOff} disabled={signing || !signature}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    {signing ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Sign & Acknowledge</>}
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>
      </div>
    )
  }

  // Participant list view
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Participant Documents</h2>
        <p className="text-gray-500 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''} you support</p>
      </div>

      {participants.length > 3 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participants..."
            className="w-full pl-10 pr-3 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 backdrop-blur-sm" />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map(p => (
            <button key={p.id} onClick={() => handleSelectParticipant(p)}
              className="w-full p-4 rounded-2xl bg-white/80 border border-gray-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-[1px] transition-all text-left flex items-center gap-4 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shrink-0 text-white text-lg font-black">
                {p.first_name?.[0]}{p.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-[15px]">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.ndis_number && `NDIS: ${p.ndis_number}`}
                  {p.address && ` · ${p.address}`}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-white/80 border border-gray-200 text-center backdrop-blur-sm">
          <Users size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-800">No participants found</p>
          <p className="text-sm text-gray-400 mt-1">{search ? 'Try a different search' : 'You\'ll see participants here once you have shifts assigned'}</p>
        </div>
      )}
    </div>
  )
}