import { allowedWidget, widgetFailure } from '@/lib/widget-auth';
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { company, config, origin } = await allowedWidget(url.searchParams.get('company'), url.searchParams.get('origin'));
    const requestOrigin = req.headers.get('Origin');
    if (requestOrigin && requestOrigin !== origin) return Response.json({ error: 'Website origin mismatch.' }, { status: 403 });
    return Response.json({ company, name: config.name, color: config.color }, { headers: { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
