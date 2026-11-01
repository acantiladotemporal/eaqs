# Configuración local de Codex

La carpeta local principal es `D:\El Árbol Que Suena`. Abrirla como proyecto y carpeta principal. Así Codex encuentra `AGENTS.md` y usa el checkout correcto para Git y los comandos.

La rama de trabajo es `codex/escuela-admision-aula`. No se ha modificado la configuración global del usuario ni se ha creado un entorno de nube.

## Preparación y acciones

En la configuración de entornos locales de la aplicación, crear estas acciones sobre la carpeta del repositorio:

| Nombre | Comando |
| --- | --- |
| Preparar | `npm ci` |
| Ver web | `npm run dev` |
| Comprobar | `npm run check` |
| Pruebas | `npm test` |
| Permisos SQL | `npm run test:db` |
| Verificar todo | `npm run verify` |
| Construir | `npm run build` |

En Windows puede utilizarse `npm.cmd` para evitar depender de la política de ejecución de PowerShell. Las claves permanecen en archivos ignorados o gestores de secretos; no se copian a la configuración versionada del entorno.

OpenAI documenta que los entornos locales se configuran desde el panel de la aplicación y se guardan en `.codex/`. La página oficial consultada no proporciona el esquema completo del archivo TOML: por eso no se ha creado un `environment.toml` manual con propiedades supuestas. Se puede versionar el archivo generado por la aplicación después de comprobar que no contiene secretos.

Referencia: [documentación oficial de entornos locales](https://learn.chatgpt.com/docs/environments/local-environment).

## Forma de trabajo

- Usar la vista previa local para revisar el resultado real.
- Revisar cambios en el diff y mantener commits pequeños por comportamiento.
- Mantener las restricciones de permisos y red existentes.
- Continuar en local hasta necesitar tareas largas remotas. Un entorno de nube no sustituye Git ni es el alojamiento de la web.
- La publicación, el dominio y los cobros son una fase posterior, sujeta a los requisitos del README.

## Conexión independiente de Supabase

El servidor `supabase_eaqs` está configurado en `.codex/config.toml` y autorizado mediante OAuth. El archivo contiene exclusivamente la URL pública de conexión, limitada al proyecto `bgmkkvgcaygtcfphkvlv` y a los grupos de herramientas necesarios. Las credenciales de OAuth las guarda Codex.

El acceso real al proyecto está verificado y las dos migraciones están aplicadas. El informe de `docs/supabase-verification.json` recoge el resultado. Usar siempre este servidor para la escuela.

El `.env` local ignorado contiene URL y clave publicable; las claves privadas del servidor y de Resend siguen pendientes. La captación permanece cerrada con `LEGAL_READY=false` y los cobros siguen desactivados.

Referencias: [MCP en Codex](https://learn.chatgpt.com/docs/extend/mcp), [proyectos y carpetas](https://learn.chatgpt.com/docs/projects), [MCP de Supabase](https://supabase.com/docs/guides/ai-tools/mcp).
