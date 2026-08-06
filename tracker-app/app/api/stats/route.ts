import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const [
    callsCount,
    messagesCount,
    visitsCount,
    activitiesCount,
    recentCalls,
    recentVisits,
    recentMessages,
    activityStatuses,
    activityPriorities,
    visitsByCompany,
    upcomingActivities,
    overdueActivities,
  ] = await Promise.all([
    // Counts
    supabase.from('calls').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('site_visits').select('*', { count: 'exact', head: true }),
    supabase.from('activities').select('*', { count: 'exact', head: true }),

    // Recent calls (last 5)
    supabase.from('calls').select('id,client_name,company,date,duration_min,engineer_name')
      .order('date', { ascending: false }).limit(5),

    // Recent site visits (last 5)
    supabase.from('site_visits').select('id,company,plant_site,visit_date,engineer_name,purpose')
      .order('visit_date', { ascending: false }).limit(5),

    // Recent messages (last 5)
    supabase.from('messages').select('id,type,direction,sender,company,subject,date')
      .order('date', { ascending: false }).limit(5),

    // Activity breakdown by status
    supabase.from('activities').select('status'),

    // Activity breakdown by priority
    supabase.from('activities').select('priority').neq('status', 'completed').neq('status', 'cancelled'),

    // Site visits grouped by company
    supabase.from('site_visits').select('company'),

    // Upcoming activities (due in next 14 days, not completed)
    supabase.from('activities')
      .select('id,title,due_date,priority,status,assigned_to,company')
      .gte('due_date', new Date().toISOString().slice(0, 10))
      .lte('due_date', new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10))
      .not('status', 'in', '("completed","cancelled")')
      .order('due_date', { ascending: true })
      .limit(8),

    // Overdue activities
    supabase.from('activities')
      .select('id,title,due_date,priority,assigned_to,company')
      .lt('due_date', new Date().toISOString().slice(0, 10))
      .not('status', 'in', '("completed","cancelled")')
      .order('due_date', { ascending: true })
      .limit(5),
  ])

  // Aggregate status counts
  const statusCounts = (activityStatuses.data ?? []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Aggregate priority counts
  const priorityCounts = (activityPriorities.data ?? []).reduce((acc, r) => {
    acc[r.priority] = (acc[r.priority] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Visits per company
  const companyCounts = (visitsByCompany.data ?? []).reduce((acc, r) => {
    acc[r.company] = (acc[r.company] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topCompanies = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([company, visits]) => ({ company, visits }))

  return NextResponse.json({
    counts: {
      calls: callsCount.count ?? 0,
      messages: messagesCount.count ?? 0,
      site_visits: visitsCount.count ?? 0,
      activities: activitiesCount.count ?? 0,
    },
    activityStatus: statusCounts,
    activityPriority: priorityCounts,
    topCompanies,
    recentCalls: recentCalls.data ?? [],
    recentVisits: recentVisits.data ?? [],
    recentMessages: recentMessages.data ?? [],
    upcomingActivities: upcomingActivities.data ?? [],
    overdueActivities: overdueActivities.data ?? [],
    generatedAt: new Date().toISOString(),
  })
}
