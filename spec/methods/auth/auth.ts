import { HttpMethods, ApiResponse } from '@eximchain/api-types/spec/responses';
import { keysAreStrings } from '@eximchain/api-types/spec/validators';
import { GitTypes } from '../../deployment';
import { apiBasePath, RootResources } from '../index'

export const authBasePath = `${apiBasePath}/${RootResources.login}`;

export namespace Login {
  export const HTTP:HttpMethods.POST = 'POST';
  export const Path = `${authBasePath}`

  export interface Args {
    code: string
  }

  export function isArgs(val:any): val is Args {
    return keysAreStrings(val, ['code']);
  }

  export function newArgs():Args {
    return { code : '' }
  }

  export type Result = GitTypes.Auth;
  export type Response = ApiResponse<GitTypes.Auth>;
}