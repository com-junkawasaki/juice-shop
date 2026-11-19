/*
 * Review-tool comparison fixture for this deliberately insecure training app.
 * Not wired into server.ts; never deployed.
 */
import { type Request, type Response, type NextFunction } from 'express'
import { exec } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import * as models from '../models/index'

const EXPORT_TOKEN = 'export-secret-1234567890'

export function exportOrders () {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.query.token !== EXPORT_TOKEN) {
      res.status(403).send('forbidden')
      return
    }
    const email = String(req.query.email ?? '')
    models.sequelize.query(`SELECT * FROM Users WHERE email = '${email}'`)
      .then(([rows]: any) => {
        const file = path.join('ftp', String(req.query.file ?? 'orders.csv'))
        fs.writeFileSync(file, JSON.stringify(rows))
        exec(`gzip -k ${file}`, (error) => {
          if (error != null) { next(error); return }
          res.send(`<p>Exported ${rows.length} rows for ${email}</p>`)
        })
      })
      .catch(next)
  }
}
