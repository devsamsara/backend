import { Request, Response } from 'express';
import { getEM } from '../database/orm';
import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { LoggerUtils } from '../utils/logger.utils';

// ─── HTML renderer (private to this controller) ───────────────────────────────

function renderPage(title: string, message: string, success: boolean): string {
  const color = success ? '#16a34a' : '#dc2626';
  const icon = success ? '✓' : '✗';
  const APP_NAME = process.env.APP_NAME ?? 'Samsara';
  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>${title} — ${APP_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #f4f4f5;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,.08);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
        }
        .header { background: #111827; padding: 28px 32px; text-align: center; }
        .header h1 { color: #fff; font-size: 20px; font-weight: 700; }
        .body { padding: 36px 32px; text-align: center; }
        .icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: ${color}20; color: ${color};
          font-size: 28px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          border: 2px solid ${color}40;
        }
        h2 { color: #111827; font-size: 18px; margin-bottom: 12px; }
        p  { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        a.btn {
          display: inline-block; background: #111827; color: #fff;
          padding: 12px 28px; border-radius: 8px;
          text-decoration: none; font-size: 14px; font-weight: 600;
        }
        .footer { padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header"><h1>${APP_NAME}</h1></div>
        <div class="body">
          <div class="icon">${icon}</div>
          <h2>${title}</h2>
          <p>${message}</p>
          ${success ? `<a class="btn" href="${APP_URL}">Ir a la app →</a>` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderPasswordResetPage(token: string, error?: string): string {
  const APP_NAME = process.env.APP_NAME ?? 'Samsara';
  const API_URL = process.env.API_URL ?? 'http://localhost:4000';

  const formAction = `${API_URL}/auth/reset-password/?token=${encodeURIComponent(token)}`;

  const errorBlock = error ? `<div class="error-box">${error}</div>` : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>Cambiar contraseña — ${APP_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #f4f4f5;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,.08);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
        }
        .header { background: #111827; padding: 28px 32px; text-align: center; }
        .header h1 { color: #fff; font-size: 20px; font-weight: 700; }
        .body { padding: 36px 32px; text-align: center; }
        .icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: #2563eb20; color: #2563eb;
          font-size: 28px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          border: 2px solid #2563eb40;
        }
        h2 { color: #111827; font-size: 18px; margin-bottom: 8px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }

        /* Campos del formulario */
        .field { text-align: left; margin-bottom: 16px; }
        .field label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }
        .field-wrapper { position: relative; }
        .field input[type="password"] {
          width: 100%; padding: 10px 40px 10px 12px;
          border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 14px; color: #111827;
          outline: none; transition: border-color .2s;
        }
        .field input[type="password"]:focus { border-color: #2563eb; }
        .field input[type="password"].invalid { border-color: #dc2626; }

        /* Botón para mostrar/ocultar contraseña */
        .toggle-pw {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; font-size: 16px; padding: 0; line-height: 1;
        }

        /* Indicador de fortaleza */
        .strength-bar {
          display: flex; gap: 4px; margin-top: 8px;
        }
        .strength-bar span {
          flex: 1; height: 4px; border-radius: 2px;
          background: #e5e7eb; transition: background .3s;
        }
        .strength-label {
          font-size: 11px; color: #9ca3af;
          text-align: right; margin-top: 4px;
        }

        /* Mensaje de validación inline */
        .hint {
          font-size: 12px; margin-top: 5px;
          min-height: 16px; text-align: left;
        }
        .hint.ok  { color: #16a34a; }
        .hint.err { color: #dc2626; }

        /* Caja de error global (token inválido, etc.) */
        .error-box {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; border-radius: 8px;
          padding: 10px 14px; font-size: 13px;
          margin-bottom: 20px; text-align: left;
        }

        /* Botón de envío */
        button[type="submit"] {
          width: 100%; background: #111827; color: #fff;
          padding: 12px; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          margin-top: 8px; transition: background .2s;
        }
        button[type="submit"]:hover:not(:disabled) { background: #1f2937; }
        button[type="submit"]:disabled {
          background: #9ca3af; cursor: not-allowed;
        }

        .footer { padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header"><h1>${APP_NAME}</h1></div>
        <div class="body">
          <div class="icon">&#128274;</div>
          <h2>Nueva contraseña</h2>
          <p class="subtitle">Elige una contraseña segura.  
Debe tener al menos 8 caracteres.</p>

          ${errorBlock}

          <form id="resetForm" method="POST" action="${formAction}" novalidate>
            <!--
              El campo que tu handler de Express leerá como req.body.newPassword.
              Si usas un middleware de GraphQL mutation en esta ruta, el nombre
              del campo sigue siendo "newPassword" en el body parseado.
            -->
            <div class="field">
              <label for="newPassword">Nueva contraseña</label>
              <div class="field-wrapper">
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button type="button" class="toggle-pw" aria-label="Mostrar contraseña"
                        onclick="toggleVisibility('newPassword', this)">&#128065;</button>
              </div>
              <div class="strength-bar" id="strengthBar">
                <span id="s1"></span><span id="s2"></span>
                <span id="s3"></span><span id="s4"></span>
              </div>
              <div class="strength-label" id="strengthLabel"></div>
              <div class="hint" id="hintNew"></div>
            </div>

            <div class="field">
              <label for="confirmPassword">Confirmar contraseña</label>
              <div class="field-wrapper">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autocomplete="new-password"
                  placeholder="Repite la contraseña"
                  required
                />
                <button type="button" class="toggle-pw" aria-label="Mostrar confirmación"
                        onclick="toggleVisibility('confirmPassword', this)">&#128065;</button>
              </div>
              <div class="hint" id="hintConfirm"></div>
            </div>

            <button type="submit" id="submitBtn" disabled>Cambiar contraseña</button>
          </form>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>

      <script>
        // ── Utilidades ──────────────────────────────────────────────────────────
        function toggleVisibility(inputId, btn) {
          const input = document.getElementById(inputId);
          const isHidden = input.type === 'password';
          input.type = isHidden ? 'text' : 'password';
          btn.textContent = isHidden ? '🙈' : '👁';
        }

        // Calcula fortaleza: 0-4
        function calcStrength(pw) {
          let score = 0;
          if (pw.length >= 8)  score++;
          if (pw.length >= 12) score++;
          if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
          if (/[0-9]/.test(pw)) score++;
          if (/[^A-Za-z0-9]/.test(pw)) score++;
          return Math.min(score, 4);
        }

        const STRENGTH_COLORS = ['#dc2626', '#f97316', '#eab308', '#16a34a'];
        const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte'];

        function updateStrengthBar(pw) {
          const score = pw.length === 0 ? 0 : calcStrength(pw);
          const bars  = document.querySelectorAll('#strengthBar span');
          const label = document.getElementById('strengthLabel');

          bars.forEach((bar, i) => {
            bar.style.background = i < score && pw.length > 0
              ? STRENGTH_COLORS[score - 1]
              : '#e5e7eb';
          });

          label.textContent = pw.length > 0 ? STRENGTH_LABELS[score - 1] : '';
          label.style.color = pw.length > 0 ? STRENGTH_COLORS[score - 1] : '#9ca3af';
        }

        // ── Validación en tiempo real ────────────────────────────────────────────
        const newPwInput     = document.getElementById('newPassword');
        const confirmPwInput = document.getElementById('confirmPassword');
        const hintNew        = document.getElementById('hintNew');
        const hintConfirm    = document.getElementById('hintConfirm');
        const submitBtn      = document.getElementById('submitBtn');

        function validateForm() {
          const pw      = newPwInput.value;
          const confirm = confirmPwInput.value;
          let newOk     = false;
          let confirmOk = false;

          // Validar nueva contraseña
          if (pw.length === 0) {
            hintNew.textContent = '';
            hintNew.className   = 'hint';
            newPwInput.classList.remove('invalid');
          } else if (pw.length < 8) {
            hintNew.textContent = 'Mínimo 8 caracteres.';
            hintNew.className   = 'hint err';
            newPwInput.classList.add('invalid');
          } else {
            hintNew.textContent = 'Contraseña válida.';
            hintNew.className   = 'hint ok';
            newPwInput.classList.remove('invalid');
            newOk = true;
          }

          // Validar confirmación
          if (confirm.length === 0) {
            hintConfirm.textContent = '';
            hintConfirm.className   = 'hint';
            confirmPwInput.classList.remove('invalid');
          } else if (confirm !== pw) {
            hintConfirm.textContent = 'Las contraseñas no coinciden.';
            hintConfirm.className   = 'hint err';
            confirmPwInput.classList.add('invalid');
          } else {
            hintConfirm.textContent = 'Las contraseñas coinciden.';
            hintConfirm.className   = 'hint ok';
            confirmPwInput.classList.remove('invalid');
            confirmOk = true;
          }

          updateStrengthBar(pw);
          submitBtn.disabled = !(newOk && confirmOk);
        }

        newPwInput.addEventListener('input', validateForm);
        confirmPwInput.addEventListener('input', validateForm);

        // ── Guardia final antes del envío ────────────────────────────────────────
        document.getElementById('resetForm').addEventListener('submit', function (e) {
          const pw      = newPwInput.value;
          const confirm = confirmPwInput.value;

          if (pw.length < 8 || pw !== confirm) {
            e.preventDefault();
            validateForm();
          }
          // Si todo es correcto, el formulario se envía normalmente por POST.
          // Express recibirá req.body.newPassword con el valor introducido.
          // El campo confirmPassword NO se envía al servidor; es solo UI.
          // Para evitar que se envíe, puedes añadir: confirmPwInput.disabled = true;
        });
      </script>
    </body>
    </html>
  `;
}

function renderAcceptInvitationPage(token: string, error?: string): string {
  const APP_NAME = process.env.APP_NAME ?? 'Samsara';
  const API_URL = process.env.API_URL ?? 'http://localhost:4000';

  // Apunta a la misma ruta pero mediante POST
  const formAction = `${API_URL}/auth/accept-invitation/?token=${encodeURIComponent(token)}`;
  const errorBlock = error
    ? `<div class="error-box" style="background:#fef2f2; border: 1px solid #fecaca; color:#dc2626; padding:10px; border-radius:8px; margin-bottom:20px; text-align: left; font-size:13px;">${error}</div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>Invitación a Compañía — ${APP_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); max-width: 480px; width: 100%; overflow: hidden; }
        .header { background: #111827; padding: 28px 32px; text-align: center; }
        .header h1 { color: #fff; font-size: 20px; font-weight: 700; }
        .body { padding: 36px 32px; text-align: center; }
        .icon { width: 64px; height: 64px; border-radius: 50%; background: #2563eb20; color: #2563eb; font-size: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        h2 { color: #111827; font-size: 18px; margin-bottom: 12px; }
        p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        button { background: #111827; color: #fff; padding: 12px 28px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; transition: background .2s; }
        button:hover { background: #1f2937; }
        .footer { padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header"><h1>${APP_NAME}</h1></div>
        <div class="body">
          <div class="icon">🏢</div>
          <h2>¡Te damos la bienvenida!</h2>
          <p>Has sido aceptado y registrado en una compañía dentro de nuestra plataforma. Haz clic en el botón de abajo para confirmar tu acceso y activar tu cuenta.</p>
          
          ${errorBlock}
          
          <form method="POST" action="${formAction}">
            <button type="submit">Aceptar invitación</button>
          </form>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const AuthController = {
  confirmAccount: async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query as { token?: string };

    if (!token) {
      res
        .status(400)
        .send(
          renderPage(
            'Token inválido',
            'No se proporcionó ningún token de confirmación.',
            false
          )
        );
      return;
    }

    try {
      const service = new AuthService(getEM());
      await service.confirmAccount(token);

      res
        .status(200)
        .send(
          renderPage(
            '¡Cuenta activada!',
            'Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión.',
            true
          )
        );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      LoggerUtils.error('confirmAccount failed', { err });
      res.status(400).send(renderPage('Verificación fallida', message, false));
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    const { token } = req.query as { token?: string };
    const newPassword = req.body.newPassword;

    if (!token) {
      res
        .status(400)
        .send(
          renderPage(
            'Token inválido',
            'No se proporcionó ningún token de restablecimiento.',
            false
          )
        );
      return;
    }
    if (req.method === 'GET') {
      res.status(200).send(renderPasswordResetPage(token));
    }
    if (req.method === 'POST') {
      if (!newPassword || newPassword.length < 8) {
        return res
          .status(400)
          .send(
            renderPasswordResetPage(
              token,
              'La contraseña debe tener al menos 8 caracteres.'
            )
          );
      }

      try {
        const service = new AuthService(getEM());
        const result = await service.resetPassword({ token, newPassword });

        res
          .status(200)
          .send(
            renderPage(
              '¡Password changed!',
              'The password has been changed successfully',
              true
            )
          );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        LoggerUtils.error('password change failed', { err });
        res
          .status(400)
          .send(renderPage('Verificación fallida', message, false));
      }
    }
  },

  confirmCompany: async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query as { token?: string };

    if (!token) {
      res
        .status(400)
        .send(
          renderPage(
            'Token inválido',
            'No se proporcionó ningún token de confirmación.',
            false
          )
        );
      return;
    }

    try {
      const service = new CompanyService(getEM());
      const result = await service.confirmCompany(token);

      res
        .status(200)
        .send(renderPage('¡Empresa aprobada!', result.message, true));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      LoggerUtils.error('confirmCompany failed', { err });
      res.status(400).send(renderPage('Verificación fallida', message, false));
    }
  },

  rejectCompany: async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query as { token?: string };

    if (!token) {
      res
        .status(400)
        .send(
          renderPage('Token inválido', 'No se proporcionó ningún token.', false)
        );
      return;
    }

    try {
      const service = new CompanyService(getEM());
      const result = await service.confirmCompany(token); // token maps to action='reject'

      res
        .status(200)
        .send(renderPage('Empresa rechazada', result.message, false));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      LoggerUtils.error('rejectCompany failed', { err });
      res.status(400).send(renderPage('Error', message, false));
    }
  },

  confirmInvitation: async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query as { token?: string };

    if (!token) {
      res
        .status(400)
        .send(
          renderPage(
            'Token inválido',
            'No se proporcionó ningún token de invitación.',
            false
          )
        );
      return;
    }

    try {
      const service = new CompanyService(getEM());
      const { resetToken, userName } = await service.confirmInvitation(token);

      // Redirigimos al flujo de reset-password ya existente.
      // El usuario debe elegir su contraseña antes de poder iniciar sesión.
      const resetUrl = `/auth/reset-password?token=${resetToken}`;
      res.redirect(302, resetUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      LoggerUtils.error('confirmInvitation failed', { err });
      res.status(400).send(renderPage('Invitación inválida', message, false));
    }
  },
};
