import dotenv from 'dotenv';
import {CompanyStatus} from "../entities/Company.entity";
import User from '../entities/User.entity';
dotenv.config();

const APP_NAME = process.env.APP_NAME ?? 'Samsara';
const APP_URL  = process.env.APP_URL  ?? 'http://localhost:3000';
const API_URL  = process.env.API_URL  ?? 'http://localhost:4000';

export function accountConfirmationEmailHtml(user: User, token: string): string {
  const confirmUrl = `${API_URL}/auth/confirm-account?token=${token}`;

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Bienvenido a SnapSite</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid { width: 100% !important; max-width: 100% !important; }
      .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; }
      .feature-cell { width: 100% !important; display: block !important; }
      .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F0F4F8; font-family:'Inter',Arial,sans-serif;">

<!-- OUTER WRAPPER -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- EMAIL CONTAINER -->
      <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ══ HEADER ══ -->
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 50%,#3B82F6 100%); padding:40px 48px 36px; border-radius:16px 16px 0 0;">

            <!-- Logo row -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:24px;">
              <tr>
                <td align="center" valign="middle" style="background:rgba(255,255,255,0.18); border-radius:10px; width:40px; height:40px; padding:0;">
                  <img src="https://img.icons8.com/ios-filled/50/ffffff/marker.png" width="22" height="22" alt="pin" style="display:block; margin:9px auto;" />
                </td>
                <td width="10"></td>
                <td align="left" valign="middle" style="font-size:20px; font-weight:700; color:#ffffff; letter-spacing:-0.3px; white-space:nowrap;">SnapSite</td>
              </tr>
            </table>

            <!-- Badge -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:16px;">
              <tr>
                <td align="center" style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:100px; padding:5px 16px;">
                  <span style="font-size:11px; font-weight:600; color:#ffffff; letter-spacing:1.2px; text-transform:uppercase;">Nuevo Registro</span>
                </td>
              </tr>
            </table>

            <!-- Headline -->
            <p style="margin:0 0 10px 0; font-size:30px; font-weight:800; color:#ffffff; line-height:1.2; letter-spacing:-0.5px;">¡Bienvenido a bordo! 🎉</p>
            <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.82); line-height:1.6;">Tu cuenta ha sido creada exitosamente.<br />Solo falta un paso para comenzar.</p>
          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td class="mobile-padding" style="padding:40px 48px;">

            <p style="margin:0 0 12px 0; font-size:17px; font-weight:600; color:#1E293B;">Hola, ${user.name} ${user.lastName}</p>
            <p style="margin:0 0 32px 0; font-size:15px; color:#475569; line-height:1.7;">
              Nos alegra tenerte en SnapSite. Tu cuenta ha sido registrada y está lista para ser activada. A continuación encontrarás un resumen de tus datos de registro y el enlace para activar tu cuenta.
            </p>

            <!-- ── DATA CARD ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #E2E8F0; border-radius:12px; overflow:hidden; margin-bottom:32px;">
              <!-- Card header -->
              <tr>
                <td colspan="2" style="background:#1E293B; padding:14px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="width:8px; height:8px; background:#22C55E; border-radius:50%; vertical-align:middle;"></td>
                      <td width="8"></td>
                      <td style="font-size:12px; font-weight:600; color:#94A3B8; letter-spacing:0.8px; text-transform:uppercase; vertical-align:middle;">Datos de tu cuenta</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Rows -->
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Nombre</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">${user.name} ${user.lastName}</td>
              </tr>
              <tr>
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Correo</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#2563EB; border-bottom:1px solid #E2E8F0; background:#ffffff;">${user.email}</td>
              </tr>
              <tr>
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Usuario</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">${user.nickname}</td>
              </tr>
              <tr>
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Rol</td>
                <td style="padding:14px 20px; border-bottom:1px solid #E2E8F0; background:#ffffff;">
                  <span style="display:inline-block; background:#DBEAFE; color:#1D4ED8; font-size:11px; font-weight:600; padding:3px 10px; border-radius:100px;">${user.role}</span>
                </td>
              </tr>
              <tr>
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Empresa</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">${user.company.name}</td>
              </tr>
              <tr>
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Fecha</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">18 de abril, 2026</td>
              </tr>
              <tr>
                <td width="130" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; background:#F8FAFC;">Estado</td>
                <td style="padding:14px 20px; background:#ffffff;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="width:6px; height:6px; background:#EAB308; border-radius:50%; vertical-align:middle;"></td>
                      <td width="6"></td>
                      <td style="display:inline-block; background:#FEF9C3; color:#A16207; font-size:11px; font-weight:600; padding:3px 10px; border-radius:100px; vertical-align:middle;">Pendiente de activación</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── DIVIDER ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr><td style="height:1px; background:#E2E8F0; font-size:0; line-height:0;">&nbsp;</td></tr>
            </table>

            <!-- ── ACTIVATION ── -->
            <p style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:#1E293B;">Activa tu cuenta</p>
            <p style="margin:0 0 24px 0; font-size:14px; color:#64748B; line-height:1.6;">
              Para comenzar a usar SnapSite, necesitas confirmar tu dirección de correo electrónico. Haz clic en el botón de abajo para activar tu cuenta de forma segura.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#1D4ED8,#2563EB); border-radius:10px;">
                  <a href="${confirmUrl}" target="_blank" style="display:block; padding:16px 32px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.2px;">
                    Activar mi cuenta &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Link fallback -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:14px 16px;">
                  <p style="margin:0 0 6px 0; font-size:12px; color:#94A3B8;">¿El botón no funciona? Copia y pega este enlace en tu navegador:</p>
                  <a href="${confirmUrl}" style="font-size:12px; color:#2563EB; word-break:break-all; text-decoration:none;">${confirmUrl}</a>
                </td>
              </tr>
            </table>

            <!-- Expiry note -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr>
                <td style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:8px; padding:12px 16px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="24" valign="top" style="font-size:16px; padding-top:1px;">&#9203;</td>
                      <td style="font-size:13px; color:#92400E; line-height:1.5;">
                        Este enlace de activación es válido por <strong>48 horas</strong> a partir de la recepción de este correo. Si expira, podrás solicitar uno nuevo desde la pantalla de inicio de sesión.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── DIVIDER ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr><td style="height:1px; background:#E2E8F0; font-size:0; line-height:0;">&nbsp;</td></tr>
            </table>

            <!-- ── FEATURES ── -->
            <p style="margin:0 0 16px 0; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px;">Lo que puedes hacer con SnapSite</p>

            <!-- Features row 1 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">
              <tr>
                <td class="feature-cell" valign="top" width="48%" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
                  <p style="margin:0 0 8px 0; font-size:20px;">📸</p>
                  <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#1E293B;">Captura de fotos</p>
                  <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5;">Documenta cada detalle del trabajo en campo con fotos y videos.</p>
                </td>
                <td width="4%"></td>
                <td class="feature-cell" valign="top" width="48%" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
                  <p style="margin:0 0 8px 0; font-size:20px;">📍</p>
                  <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#1E293B;">Geolocalización</p>
                  <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5;">Organiza proyectos por ubicación GPS automáticamente.</p>
                </td>
              </tr>
            </table>
            <!-- Features row 2 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="feature-cell" valign="top" width="48%" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
                  <p style="margin:0 0 8px 0; font-size:20px;">🤝</p>
                  <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#1E293B;">Colaboración</p>
                  <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5;">Trabaja en equipo y comparte actualizaciones en tiempo real.</p>
                </td>
                <td width="4%"></td>
                <td class="feature-cell" valign="top" width="48%" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
                  <p style="margin:0 0 8px 0; font-size:20px;">📊</p>
                  <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#1E293B;">Reportes</p>
                  <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5;">Genera reportes profesionales con un solo clic.</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td align="center" class="mobile-padding" style="background:#1E293B; padding:28px 48px; border-radius:0 0 16px 16px;">

            <!-- Footer logo -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:16px;">
              <tr>
                <td align="center" valign="middle" style="background:rgba(255,255,255,0.1); border-radius:7px; width:28px; height:28px; padding:0;">
                  <img src="https://img.icons8.com/ios-filled/50/ffffff/marker.png" width="14" height="14" alt="pin" style="display:block; margin:7px auto;" />
                </td>
                <td width="8"></td>
                <td style="font-size:14px; font-weight:700; color:#ffffff; vertical-align:middle;">SnapSite</td>
              </tr>
            </table>

            <!-- Footer links -->
            <p style="margin:0 0 16px 0;">
              <a href="#" style="color:#94A3B8; text-decoration:none; font-size:12px; margin:0 8px;">Centro de ayuda</a>
              <a href="#" style="color:#94A3B8; text-decoration:none; font-size:12px; margin:0 8px;">Privacidad</a>
              <a href="#" style="color:#94A3B8; text-decoration:none; font-size:12px; margin:0 8px;">Términos</a>
              <a href="#" style="color:#94A3B8; text-decoration:none; font-size:12px; margin:0 8px;">Cancelar suscripción</a>
            </p>

            <p style="margin:0; font-size:11px; color:#475569; line-height:1.7;">
              &copy; 2026 SnapSite, Inc. &middot; Todos los derechos reservados<br />
              Recibiste este correo porque te registraste en <a href="#" style="color:#64748B; text-decoration:none;">snapsite.app</a><br />
              Si no creaste esta cuenta, <a href="#" style="color:#64748B; text-decoration:none;">ignora este mensaje</a>.
            </p>
          </td>
        </tr>

      </table>
      <!-- END EMAIL CONTAINER -->

    </td>
  </tr>
</table>
<!-- END OUTER WRAPPER -->

</body>
</html>

  `;
}

export function companyConfirmationEmailHtml(
  token: string,
  company: { name: string; industry: string; size: number, status: CompanyStatus },
  createdBy: { name: string; email: string },
): string {
  const confirmUrl  = `${API_URL}/admin/confirm-company?token=${token}`;
  const rejectUrl   = `${API_URL}/admin/reject-company?token=${token}`;

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Tu empresa ya está en SnapSite</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .stat-cell { display: block !important; width: 100% !important; text-align: center !important; padding: 8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F0F4F8; font-family:'Inter',Arial,sans-serif;">

<!-- OUTER WRAPPER -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- EMAIL CONTAINER -->
      <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ══ HEADER ══ -->
        <tr>
          <td align="center" style="background:#1E293B; padding:44px 48px 40px; border-radius:16px 16px 0 0;">

            <!-- Logo row -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:24px;">
              <tr>
                <td align="center" valign="middle" style="background:#2563EB; border-radius:10px; width:40px; height:40px; padding:0;">
                  <img src="https://img.icons8.com/ios-filled/50/ffffff/marker.png" width="22" height="22" alt="pin" style="display:block; margin:9px auto;" />
                </td>
                <td width="10"></td>
                <td align="left" valign="middle" style="font-size:20px; font-weight:700; color:#ffffff; letter-spacing:-0.3px; white-space:nowrap;">SnapSite</td>
              </tr>
            </table>

            <!-- Company Avatar -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:20px;">
              <tr>
                <td align="center" valign="middle" style="background:#2563EB; border-radius:18px; width:72px; height:72px; border:3px solid rgba(255,255,255,0.15);">
                  <span style="font-size:26px; font-weight:800; color:#ffffff; line-height:72px; display:block;">CN</span>
                </td>
              </tr>
            </table>

            <!-- Badge -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:16px;">
              <tr>
                <td align="center" style="background:rgba(37,99,235,0.3); border:1px solid rgba(59,130,246,0.5); border-radius:100px; padding:5px 16px;">
                  <span style="font-size:11px; font-weight:600; color:#93C5FD; letter-spacing:1.2px; text-transform:uppercase;">Empresa Registrada</span>
                </td>
              </tr>
            </table>

            <!-- Headline -->
            <p style="margin:0 0 10px 0; font-size:28px; font-weight:800; color:#ffffff; line-height:1.25; letter-spacing:-0.5px;">
              ¡<span style="color:#60A5FA;">${company.name}</span><br />ya está en SnapSite!
            </p>
            <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.7); line-height:1.6;">
              Tu empresa ha sido registrada exitosamente.<br />Activa tu cuenta y empieza a operar hoy.
            </p>
          </td>
        </tr>

        <!-- ══ STATS STRIP ══ -->
        <tr>
          <td style="background:#F8FAFC; border-bottom:1px solid #E2E8F0; padding:20px 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="stat-cell" align="center" width="25%" style="padding:0 8px;">
                  <p style="margin:0 0 2px 0; font-size:22px; font-weight:800; color:#2563EB; letter-spacing:-0.5px;">&infin;</p>
                  <p style="margin:0; font-size:10px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px;">Proyectos</p>
                </td>
                <td width="1" style="background:#E2E8F0;">&nbsp;</td>
                <td class="stat-cell" align="center" width="25%" style="padding:0 8px;">
                  <p style="margin:0 0 2px 0; font-size:22px; font-weight:800; color:#2563EB; letter-spacing:-0.5px;">50+</p>
                  <p style="margin:0; font-size:10px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px;">Integraciones</p>
                </td>
                <td width="1" style="background:#E2E8F0;">&nbsp;</td>
                <td class="stat-cell" align="center" width="25%" style="padding:0 8px;">
                  <p style="margin:0 0 2px 0; font-size:22px; font-weight:800; color:#2563EB; letter-spacing:-0.5px;">24/7</p>
                  <p style="margin:0; font-size:10px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px;">Soporte</p>
                </td>
                <td width="1" style="background:#E2E8F0;">&nbsp;</td>
                <td class="stat-cell" align="center" width="25%" style="padding:0 8px;">
                  <p style="margin:0 0 2px 0; font-size:22px; font-weight:800; color:#2563EB; letter-spacing:-0.5px;">99.9%</p>
                  <p style="margin:0; font-size:10px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px;">Uptime</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td class="mobile-padding" style="padding:40px 48px;">

            <p style="margin:0 0 12px 0; font-size:17px; font-weight:600; color:#1E293B;">Hola, equipo de Construcciones del Norte</p>
            <p style="margin:0 0 32px 0; font-size:15px; color:#475569; line-height:1.7;">
              Felicitaciones por dar el primer paso hacia una gestión de campo más eficiente. Tu empresa ha sido registrada en SnapSite y está lista para ser activada. A continuación encontrarás los datos de registro de tu organización y los pasos para comenzar.
            </p>

            <!-- ── COMPANY DATA CARD ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #E2E8F0; border-radius:12px; overflow:hidden; margin-bottom:24px;">
              <!-- Card header -->
              <tr>
                <td colspan="2" style="background:#0F172A; padding:14px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td valign="middle">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="width:8px; height:8px; background:#3B82F6; border-radius:50%; vertical-align:middle;"></td>
                            <td width="8"></td>
                            <td style="font-size:12px; font-weight:600; color:#94A3B8; letter-spacing:0.8px; text-transform:uppercase; vertical-align:middle;">Datos de la empresa</td>
                          </tr>
                        </table>
                      </td>
                      <td align="right" valign="middle" style="font-size:11px; font-weight:500; color:#475569; font-family:'Courier New',monospace;">#EMP-2026-00847</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Data rows -->
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Empresa</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">${company.name}</td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">RFC / NIT</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">CDN-850412-3K7</td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Correo</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#2563EB; border-bottom:1px solid #E2E8F0; background:#ffffff;">${createdBy.email}</td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Teléfono</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">+52 (614) 555-0192</td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Industria</td>
                <td style="padding:14px 20px; border-bottom:1px solid #E2E8F0; background:#ffffff;">
                  <span style="display:inline-block; background:#EFF6FF; color:#1D4ED8; font-size:11px; font-weight:600; padding:3px 10px; border-radius:6px;">${company.industry}</span>
                </td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Tamaño</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">${company.size}</td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Plan</td>
                <td style="padding:14px 20px; border-bottom:1px solid #E2E8F0; background:#ffffff;">
                  <span style="display:inline-block; background:#2563EB; color:#ffffff; font-size:11px; font-weight:700; padding:4px 12px; border-radius:100px;">&#11088; Professional</span>
                </td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">Registro</td>
                <td style="padding:14px 20px; font-size:14px; font-weight:500; color:#1E293B; border-bottom:1px solid #E2E8F0; background:#ffffff;">18 de abril, 2026</td>
              </tr>
              <tr>
                <td width="140" style="padding:14px 20px; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.6px; background:#F8FAFC;">Estado</td>
                <td style="padding:14px 20px; background:#ffffff;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="width:6px; height:6px; background:#EAB308; border-radius:50%; vertical-align:middle;"></td>
                      <td width="6"></td>
                      <td style="display:inline-block; background:#FEF9C3; color:#A16207; font-size:11px; font-weight:600; padding:3px 10px; border-radius:100px; vertical-align:middle;">${company.status}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── ADMIN CARD ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; margin-bottom:32px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td valign="middle" width="44">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" valign="middle" style="background:#2563EB; border-radius:50%; width:44px; height:44px;">
                              <span style="font-size:16px; font-weight:700; color:#ffffff; line-height:44px; display:block;">${createdBy.name.charAt(0).toUpperCase()}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="14"></td>
                      <td valign="middle">
                        <p style="margin:0 0 2px 0; font-size:11px; font-weight:600; color:#3B82F6; text-transform:uppercase; letter-spacing:0.6px;">Administrador de cuenta</p>
                        <p style="margin:0 0 2px 0; font-size:14px; font-weight:700; color:#1E293B;">${createdBy.name}</p>
                        <p style="margin:0; font-size:13px; color:#2563EB;">${createdBy.email}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── DIVIDER ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr><td style="height:1px; background:#E2E8F0; font-size:0; line-height:0;">&nbsp;</td></tr>
            </table>

            <!-- ── ACTIVATION ── -->
            <p style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:#1E293B;">Activa tu empresa</p>
            <p style="margin:0 0 24px 0; font-size:14px; color:#64748B; line-height:1.6;">
              Para activar la cuenta de tu empresa y comenzar a invitar a tu equipo, el administrador de cuenta debe confirmar el correo electrónico registrado. Haz clic en el botón de abajo para completar la activación.
            </p>

            <!-- CTA Primary -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:10px;">
              <tr>
                <td align="center" style="background:#1E293B; border-radius:10px;">
                  <a href="${confirmUrl}" target="_blank" style="display:block; padding:16px 32px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.2px;">
                    Activar cuenta de empresa &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- CTA Secondary -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td align="center" style="background:#2563EB; border-radius:10px;">
                  <a href="{{DASHBOARD_LINK}}" target="_blank" style="display:block; padding:13px 32px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; letter-spacing:0.2px;">
                    Ir al panel de administración
                  </a>
                </td>
              </tr>
            </table>

            <!-- Link fallback -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:14px 16px;">
                  <p style="margin:0 0 6px 0; font-size:12px; color:#94A3B8;">¿El botón no funciona? Copia y pega este enlace en tu navegador:</p>
                  <a href="${confirmUrl}" style="font-size:12px; color:#2563EB; word-break:break-all; text-decoration:none;">${confirmUrl}</a>
                </td>
              </tr>
            </table>

            <!-- Expiry note -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr>
                <td style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:8px; padding:12px 16px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="24" valign="top" style="font-size:16px; padding-top:1px;">&#9203;</td>
                      <td style="font-size:13px; color:#92400E; line-height:1.5;">
                        Este enlace de activación es válido por <strong>72 horas</strong> a partir de la recepción de este correo. Si expira, el administrador puede solicitar uno nuevo desde la pantalla de inicio de sesión.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── DIVIDER ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr><td style="height:1px; background:#E2E8F0; font-size:0; line-height:0;">&nbsp;</td></tr>
            </table>

            <!-- ── NEXT STEPS ── -->
            <p style="margin:0 0 16px 0; font-size:12px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:0.8px;">Próximos pasos</p>

            <!-- Step 1 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:0; border-bottom:1px solid #F1F5F9;">
              <tr>
                <td valign="top" style="padding:14px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td valign="top" width="28">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" valign="middle" style="background:#2563EB; border-radius:50%; width:28px; height:28px;">
                              <span style="font-size:13px; font-weight:700; color:#ffffff; line-height:28px; display:block;">1</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="14"></td>
                      <td valign="top">
                        <p style="margin:0 0 3px 0; font-size:14px; font-weight:600; color:#1E293B;">Activa tu cuenta de empresa</p>
                        <p style="margin:0; font-size:13px; color:#64748B; line-height:1.5;">Haz clic en el enlace de activación de arriba para verificar tu correo y habilitar la cuenta.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Step 2 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #F1F5F9;">
              <tr>
                <td valign="top" style="padding:14px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td valign="top" width="28">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" valign="middle" style="background:#2563EB; border-radius:50%; width:28px; height:28px;">
                              <span style="font-size:13px; font-weight:700; color:#ffffff; line-height:28px; display:block;">2</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="14"></td>
                      <td valign="top">
                        <p style="margin:0 0 3px 0; font-size:14px; font-weight:600; color:#1E293B;">Configura tu perfil de empresa</p>
                        <p style="margin:0; font-size:13px; color:#64748B; line-height:1.5;">Agrega tu logo, dirección y personaliza los ajustes de tu organización.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Step 3 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #F1F5F9;">
              <tr>
                <td valign="top" style="padding:14px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td valign="top" width="28">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" valign="middle" style="background:#2563EB; border-radius:50%; width:28px; height:28px;">
                              <span style="font-size:13px; font-weight:700; color:#ffffff; line-height:28px; display:block;">3</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="14"></td>
                      <td valign="top">
                        <p style="margin:0 0 3px 0; font-size:14px; font-weight:600; color:#1E293B;">Invita a tu equipo</p>
                        <p style="margin:0; font-size:13px; color:#64748B; line-height:1.5;">Añade a tus técnicos, supervisores y administradores para comenzar a colaborar.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Step 4 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr>
                <td valign="top" style="padding:14px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td valign="top" width="28">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" valign="middle" style="background:#2563EB; border-radius:50%; width:28px; height:28px;">
                              <span style="font-size:13px; font-weight:700; color:#ffffff; line-height:28px; display:block;">4</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="14"></td>
                      <td valign="top">
                        <p style="margin:0 0 3px 0; font-size:14px; font-weight:600; color:#1E293B;">Crea tu primer proyecto</p>
                        <p style="margin:0; font-size:13px; color:#64748B; line-height:1.5;">Empieza a documentar trabajos, capturar fotos y generar reportes desde el campo.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── SUPPORT BANNER ── -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td align="center" style="background:#2563EB; border-radius:12px; padding:24px;">
                  <p style="margin:0 0 4px 0; font-size:15px; font-weight:700; color:#ffffff;">¿Necesitas ayuda para comenzar?</p>
                  <p style="margin:0 0 16px 0; font-size:14px; color:rgba(255,255,255,0.85); line-height:1.5;">Nuestro equipo de onboarding está disponible para guiarte en cada paso del proceso de configuración.</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                    <tr>
                      <td style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); border-radius:8px;">
                        <a href="https://snapsite.app/support" target="_blank" style="display:block; padding:9px 20px; font-size:13px; font-weight:600; color:#ffffff; text-decoration:none;">
                          Contactar soporte &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td align="center" class="mobile-padding" style="background:#0F172A; padding:28px 48px; border-radius:0 0 16px 16px;">

            <!-- Footer logo -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:16px;">
              <tr>
                <td align="center" valign="middle" style="background:#2563EB; border-radius:7px; width:28px; height:28px; padding:0;">
                  <img src="https://img.icons8.com/ios-filled/50/ffffff/marker.png" width="14" height="14" alt="pin" style="display:block; margin:7px auto;" />
                </td>
                <td width="8"></td>
                <td style="font-size:14px; font-weight:700; color:#ffffff; vertical-align:middle;">SnapSite</td>
              </tr>
            </table>

            <!-- Footer links -->
            <p style="margin:0 0 16px 0;">
              <a href="#" style="color:#64748B; text-decoration:none; font-size:12px; margin:0 8px;">Centro de ayuda</a>
              <a href="#" style="color:#64748B; text-decoration:none; font-size:12px; margin:0 8px;">Privacidad</a>
              <a href="#" style="color:#64748B; text-decoration:none; font-size:12px; margin:0 8px;">Términos</a>
              <a href="#" style="color:#64748B; text-decoration:none; font-size:12px; margin:0 8px;">Cancelar suscripción</a>
            </p>

            <p style="margin:0; font-size:11px; color:#334155; line-height:1.7;">
              &copy; 2026 SnapSite, Inc. &middot; Todos los derechos reservados<br />
              Recibiste este correo porque tu empresa fue registrada en <a href="#" style="color:#475569; text-decoration:none;">snapsite.app</a><br />
              Si no realizaste este registro, <a href="#" style="color:#475569; text-decoration:none;">repórtalo aquí</a>.
            </p>
          </td>
        </tr>

      </table>
      <!-- END EMAIL CONTAINER -->

    </td>
  </tr>
</table>
<!-- END OUTER WRAPPER -->

</body>
</html>
`;
}

// ─── Password Reset → user ────────────────────────────────────────────────────

export function passwordResetEmailHtml(name: string, resetToken: string): string {
  const resetUrl = `${API_URL}/auth/reset-password?token=${resetToken}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>Restablecer contraseña</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

            <tr>
              <td style="background:#111827;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">${APP_NAME}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 40px 24px;">
                <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">
                  Restablece tu contraseña 🔐
                </h2>
                <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                  Hola <strong>${name}</strong>, recibimos una solicitud para restablecer tu contraseña.
                </p>
                <p style="margin:0 0 32px;color:#6b7280;font-size:13px;line-height:1.6;">
                  Este enlace expirará en <strong>1 hora</strong>. Si no lo solicitaste, ignora este mensaje.
                </p>

                <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="background:#111827;border-radius:8px;">
                      <a href="${resetUrl}"
                         style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">
                        Restablecer contraseña →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;color:#9ca3af;font-size:12px;word-break:break-all;">
                  ¿El botón no funciona? Copia este enlace:<br/>
                  <a href="${resetUrl}" style="color:#6b7280;">${resetUrl}</a>
                </p>
              </td>
            </tr>

            <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>
            <tr>
              <td style="padding:24px 40px;text-align:center;">
                <p style="margin:0;color:#9ca3af;font-size:13px;">
                  © ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}
