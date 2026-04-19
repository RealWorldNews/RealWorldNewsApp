export function log(source: string, msg: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  const tail = extra ? ` ${JSON.stringify(extra)}` : ''
  console.log(`[${ts}] [${source}] ${msg}${tail}`)
}

export function warn(source: string, msg: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  const tail = extra ? ` ${JSON.stringify(extra)}` : ''
  console.warn(`[${ts}] [${source}] WARN ${msg}${tail}`)
}

export function error(source: string, msg: string, extra?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  const tail = extra ? ` ${JSON.stringify(extra)}` : ''
  console.error(`[${ts}] [${source}] ERROR ${msg}${tail}`)
}
