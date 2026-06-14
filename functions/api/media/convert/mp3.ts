import { OracleProxyEnv, proxyToOracle, readJsonBody } from '../../../_shared/oracle-proxy';

export const onRequestPost: PagesFunction<OracleProxyEnv> = async (context) => {
  const body = await readJsonBody(context.request);
  return proxyToOracle(context, { path: '/nca/media/convert/mp3', method: 'POST', body });
};
