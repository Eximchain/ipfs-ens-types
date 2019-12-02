export const apiBasePath = '/v1';

export enum RootResources {
  deployments = 'deployments',
  login = 'login'
}

import AuthTypes from './auth';
import PrivateTypes from './private';

export import Auth = AuthTypes;
export import Private = PrivateTypes;

export namespace Methods {
  export import Auth = AuthTypes;
  export import Private = PrivateTypes;
}

export default Methods;