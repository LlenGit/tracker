'use client'
import { Download } from 'lucide-react'

interface Props {
  table: 'calls' | 'messages' | 'site_visits' | 'activities'
  label?: string
}

export default function ExportButton({ table, label }: Props) {
  const handleExport = async () => {
    const res = await fetch(`/api/export?table=${table}`)
    if (!res.ok) { alert('Export failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
    >
      <Download size={15} />
      {label ?? 'Export CSV'}
    </button>
  )
}
