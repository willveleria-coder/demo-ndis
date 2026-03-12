import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Calendar({ events = [], onDateClick, selectedDate, colorMode = 'orange' }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  
  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }
  
  const isToday = (day) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
  }
  
  const isSelected = (day) => {
    if (!selectedDate) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return selectedDate === dateStr
  }
  
  const gradientFrom = colorMode === 'teal' ? 'from-teal-500' : 'from-orange-500'
  const gradientTo = colorMode === 'teal' ? 'to-cyan-500' : 'to-amber-500'
  
  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 md:h-14" />)
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day)
    const hasEvents = dayEvents.length > 0
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    days.push(
      <button
        key={day}
        onClick={() => onDateClick?.(dateStr, dayEvents)}
        className={`relative h-10 md:h-14 rounded-lg md:rounded-xl text-sm font-medium transition-all
          ${isToday(day) ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg` : ''}
          ${isSelected(day) && !isToday(day) ? 'bg-gray-100 ring-2 ring-orange-400' : ''}
          ${!isToday(day) && !isSelected(day) ? 'hover:bg-gray-50' : ''}
        `}
      >
        <span className={isToday(day) ? 'text-white' : 'text-gray-700'}>{day}</span>
        {hasEvents && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {dayEvents.slice(0, 3).map((e, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${
                  e.status === 'In Progress' ? 'bg-emerald-500' : 
                  e.status === 'Completed' ? 'bg-orange-400' : 
                  'bg-cyan-500'
                }`} 
              />
            ))}
            {dayEvents.length > 3 && (
              <span className="text-[8px] text-gray-400">+{dayEvents.length - 3}</span>
            )}
          </div>
        )}
      </button>
    )
  }
  
  return (
    <div className="p-3 md:p-4 rounded-xl md:rounded-2xl glass shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <h3 className="font-bold text-gray-800 text-sm md:text-base">
          {MONTHS[month]} {year}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-[10px] md:text-xs font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  )
}