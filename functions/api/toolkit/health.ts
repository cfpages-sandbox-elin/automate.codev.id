import { OracleProxyEnv, proxyToOracle } from '../../_shared/oracle-proxy';

export const onRequestGet: PagesFunction<OracleProxyEnv> = async (context) => {
  return proxyToOracle(context, { path: '/nca/toolkit/health' });
};
