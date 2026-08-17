import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (!q) return NextResponse.json({ results: [] })

  const like = `%${q}%`

  const [callsRes, messagesRes, visitsRes, activitiesRes, portalsRes, ticketsRes, sitesRes] = await Promise.all([
    supabase.from('calls').select('*').or(
      `client_name.ilike.${like},company.ilike.${like},engineer_name.ilike.${like},notes.ilike.${like},tags.ilike.${like},phone.ilike.${like}`
    ).order('date', { ascending: false }).limit(30),

    supabase.from('messages').select('*').or(
      `sender.ilike.${like},recipient.ilike.${like},company.ilike.${like},subject.ilike.${like},body_summary.ilike.${like},engineer_name.ilike.${like},tags.ilike.${like},type.ilike.${like}`
    ).order('date', { ascending: false }).limit(30),

    supabase.from('site_visits').select('*').or(
      `company.ilike.${like},plant_site.ilike.${like},location.ilike.${like},engineer_name.ilike.${like},purpose.ilike.${like},gatepass_docs.ilike.${like},ppe_required.ilike.${like},notes.ilike.${like},tags.ilike.${like}`
    ).order('visit_date', { ascending: false }).limit(30),

    supabase.from('activities').select('*').or(
      `title.ilike.${like},description.ilike.${like},category.ilike.${like},assigned_to.ilike.${like},company.ilike.${like},notes.ilike.${like},tags.ilike.${like}`
    ).order('created_at', { ascending: false }).limit(30),

    // Exclude password from portal search results
    supabase.from('glen_portals').select('id,company,plant_site,system_name,login_type,url,username,access_scope,remark,tags,created_at').or(
      `company.ilike.${like},plant_site.ilike.${like},system_name.ilike.${like},login_type.ilike.${like},username.ilike.${like},access_scope.ilike.${like},remark.ilike.${like}`
    ).order('company').limit(20),

    supabase.from('glen_tickets').select('*').or(
      `ticket_id.ilike.${like},submitted_by.ilike.${like},company.ilike.${like},plant_site.ilike.${like},category.ilike.${like},assigned_to.ilike.${like},subject.ilike.${like},description.ilike.${like},issue_type.ilike.${like},notes.ilike.${like}`
    ).order('date_submitted', { ascending: false }).limit(30),

    supabase.from('glen_sites').select('*').or(
      `company.ilike.${like},plant_site.ilike.${like},location_name.ilike.${like},station_type.ilike.${like},data_logger_id.ilike.${like},parameter.ilike.${like},make.ilike.${like},model.ilike.${like}`
    ).order('location_name').limit(30),
  ])

  const results = [
    ...(callsRes.data ?? []).map(r => ({ table: 'calls', record: r })),
    ...(messagesRes.data ?? []).map(r => ({ table: 'messages', record: r })),
    ...(visitsRes.data ?? []).map(r => ({ table: 'site_visits', record: r })),
    ...(activitiesRes.data ?? []).map(r => ({ table: 'activities', record: r })),
    ...(portalsRes.data ?? []).map(r => ({ table: 'glen_portals', record: r })),
    ...(ticketsRes.data ?? []).map(r => ({ table: 'glen_tickets', record: r })),
    ...(sitesRes.data ?? []).map(r => ({ table: 'glen_sites', record: r })),
  ]

  return NextResponse.json({
    results,
    counts: {
      calls: callsRes.data?.length ?? 0,
      messages: messagesRes.data?.length ?? 0,
      site_visits: visitsRes.data?.length ?? 0,
      activities: activitiesRes.data?.length ?? 0,
      glen_portals: portalsRes.data?.length ?? 0,
      glen_tickets: ticketsRes.data?.length ?? 0,
      glen_sites: sitesRes.data?.length ?? 0,
    }
  })
}
