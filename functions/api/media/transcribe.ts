import { proxyToOracle, readJsonBody } from '../../_shared/oracle-proxy';
import type { OracleProxyEnv } from '../../_shared/oracle-proxy';

export const onRequestPost: PagesFunction<OracleProxyEnv> = async (context) => {
  const body = await readJsonBody(context.request);
  return proxyToOracle(context, { path: '/nca/media/transcribe', method: 'POST', body });
};
