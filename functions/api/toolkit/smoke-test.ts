import { OracleProxyEnv, proxyToOracle } from '../../_shared/oracle-proxy';

export const onRequestPost: PagesFunction<OracleProxyEnv> = async (context) => {
  return proxyToOracle(context, { path: '/nca/toolkit/smoke-test' });
};
