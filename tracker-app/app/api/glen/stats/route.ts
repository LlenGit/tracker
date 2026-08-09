import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET() {
  const [
    ticketsAll,
    portalsCount,
    sitesAll,
    recentTickets,
  ] = await Promise.all([
    supabase.from('glen_tickets').select('status,category,priority,issue_type,resolution_days'),
    supabase.from('glen_portals').select('*', { count: 'exact', head: true }),
    supabase.from('glen_sites').select('status,station_type,company,plant_site'),
    supabase.from('glen_tickets')
      .select('id,ticket_id,date_submitted,subject,category,priority,status,assigned_to,company,plant_site,issue_type')
      .order('date_submitted', { ascending: false })
      .limit(10),
  ])

  const tickets = ticketsAll.data ?? []

  // Status counts
  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Category counts
  const categoryCounts = tickets.reduce((acc, t) => {
    if (t.category) acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Priority counts
  const priorityCounts = tickets.reduce((acc, t) => {
    if (t.priority) acc[t.priority] = (acc[t.priority] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Issue type breakdown
  const issueTypeCounts = tickets.reduce((acc, t) => {
    const k = t.issue_type ?? 'Other'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topIssueTypes = Object.entries(issueTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }))

  // Avg resolution days (resolved only)
  const resolved = tickets.filter(t => t.status === 'Resolved' && t.resolution_days != null)
  const avgResolutionDays = resolved.length
    ? Math.round(resolved.reduce((s, t) => s + (t.resolution_days ?? 0), 0) / resolved.length)
    : 0

  // Sites by status
  const siteStatusCounts = (sitesAll.data ?? []).reduce((acc, s) => {
    const k = s.status ?? 'Active'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    totals: {
      tickets: tickets.length,
      portals: portalsCount.count ?? 0,
      sites: sitesAll.data?.length ?? 0,
    },
    ticketStatus: statusCounts,
    ticketCategory: categoryCounts,
    ticketPriority: priorityCounts,
    topIssueTypes,
    avgResolutionDays,
    siteStatus: siteStatusCounts,
    recentTickets: recentTickets.data ?? [],
    generatedAt: new Date().toISOString(),
  })
}
