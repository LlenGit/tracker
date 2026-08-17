import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
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
      supabase.from('calls').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('site_visits').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
      supabase.from('calls').select('id,client_name,company,date,duration_min,engineer_name').order('date', { ascending: false }).limit(5),
      supabase.from('site_visits').select('id,company,plant_site,visit_date,engineer_name,purpose').order('visit_date', { ascending: false }).limit(5),
      supabase.from('messages').select('id,type,direction,sender,company,subject,date').order('date', { ascending: false }).limit(5),
      supabase.from('activities').select('status'),
      supabase.from('activities').select('priority').neq('status', 'completed').neq('status', 'cancelled'),
      supabase.from('site_visits').select('company'),
      supabase.from('activities')
        .select('id,title,due_date,priority,status,assigned_to,company')
        .gte('due_date', new Date().toISOString().slice(0, 10))
        .lte('due_date', new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10))
        .not('status', 'in', '("completed","cancelled")')
        .order('due_date', { ascending: true })
        .limit(8),
      supabase.from('activities')
        .select('id,title,due_date,priority,assigned_to,company')
        .lt('due_date', new Date().toISOString().slice(0, 10))
        .not('status', 'in', '("completed","cancelled")')
        .order('due_date', { ascending: true })
        .limit(5),
    ])

    const statusCounts = (activityStatuses.data ?? []).reduce((acc: Record<string, number>, r: { status: string }) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {})

    const priorityCounts = (activityPriorities.data ?? []).reduce((acc: Record<string, number>, r: { priority: string }) => {
      acc[r.priority] = (acc[r.priority] ?? 0) + 1
      return acc
    }, {})

    const companyCounts = (visitsByCompany.data ?? []).reduce((acc: Record<string, number>, r: { company: string }) => {
      acc[r.company] = (acc[r.company] ?? 0) + 1
      return acc
    }, {})
    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([company, visits]) => ({ company, visits }))

    return NextResponse.json({
      counts: {
        calls:       callsCount.count ?? 0,
        messages:    messagesCount.count ?? 0,
        site_visits: visitsCount.count ?? 0,
        activities:  activitiesCount.count ?? 0,
      },
      activityStatus:     statusCounts,
      activityPriority:   priorityCounts,
      topCompanies,
      recentCalls:        recentCalls.data ?? [],
      recentVisits:       recentVisits.data ?? [],
      recentMessages:     recentMessages.data ?? [],
      upcomingActivities: upcomingActivities.data ?? [],
      overdueActivities:  overdueActivities.data ?? [],
      generatedAt:        new Date().toISOString(),
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
