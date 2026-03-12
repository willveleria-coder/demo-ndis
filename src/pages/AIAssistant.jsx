import { Bot, Sparkles, Zap, Shield, FileText, Users } from 'lucide-react'

const FEATURES = [
  { icon: Shield, label: 'Compliance Checks', desc: 'Instantly check staff qualifications and expiring documents', color: 'from-red-500 to-rose-500' },
  { icon: FileText, label: 'Incident Drafting', desc: 'AI-assisted incident report writing with NDIS guidelines', color: 'from-orange-500 to-amber-500' },
  { icon: Users, label: 'Staff Insights', desc: 'Get summaries of staff hours, availability and performance', color: 'from-teal-500 to-cyan-500' },
  { icon: Zap, label: 'NDIS Guidance', desc: 'Instant answers on Practice Standards, pricing and compliance', color: 'from-violet-500 to-purple-500' },
]

export default function AIAssistant() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-200 mx-auto mb-5">
          <Bot size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          AI Assistant
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-pink-500 text-white">COMING SOON</span>
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Your intelligent NDIS compliance and operations assistant is being built. Powered by advanced AI with full access to your organisation's data.
        </p>
      </div>

      <div className="mb-10">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 text-center">What it will do</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow mb-3`}>
                <f.icon size={20} className="text-white" />
              </div>
              <p className="font-bold text-gray-800 text-sm mb-1">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={18} className="text-violet-500" />
          <p className="font-bold text-violet-800 text-sm">In Development</p>
        </div>
        <p className="text-xs text-violet-600">This feature will be added to your system at no extra charge. You'll be notified when it's ready.</p>
      </div>
    </div>
  )
}