import OctokitOauthTypes from '@octokit/auth-oauth-app/dist-types/types';
import Octokit from '@octokit/rest';
import { keysAreStrings, isObject, isString } from '@eximchain/api-types/spec/validators'
import { isNumber } from 'util';

/**
 * Barebones arguments required to create a deployment.
 * Sent to us by client, persisted in S3.
 */
export interface DeployArgs {
  packageDir: string
  buildDir: string
  owner: string
  repo: string
  branch: string
  ensName: string
  sourceProvider: SourceProviders
}

export function isDeployArgs(val:any): val is DeployArgs {
  return keysAreStrings(val, ['packageDir', 'buildDir', 'owner', 'repo', 'branch', 'ensName', 'sourceProvider'])
}

export function newDeployArgs():DeployArgs{
  return {
    packageDir: '',
    buildDir: '',
    owner: '',
    repo: '',
    branch: '',
    ensName: '',
    sourceProvider: SourceProviders.GitHub
  }
}

/**
 * Complete data representing a deployment, persisted
 * in our DynamoDB records.
 */
export interface DeployItem extends DeployArgs {
  createdAt: string
  updatedAt: string
  username: string
  state: DeployStates
  codepipelineName: string
  transitions: {
    source?: Transitions.Pipeline
    build?: Transitions.Pipeline
    ipfs?: Transitions.Ipfs
    ensRegister?: Transitions.Ens
    ensSetResolver?: Transitions.Ens
    ensSetContent?: Transitions.Ens
  }
}

export function isDeployItem(val:any): val is DeployItem {
  const isBaseItem = (
    isDeployArgs(val) &&
    keysAreStrings(val, [
      'createdAt', 'updatedAt', 'username', 'codepipelineName'
    ])
  );
  if (!isBaseItem) return false;
  if (val.source && !Transitions.isPipeline(val.source)) return false;
  if (val.build && !Transitions.isPipeline(val.build)) return false;
  if (val.ipfs && !Transitions.isIpfs(val.ipfs)) return false;
  if (val.ensRegister && !Transitions.isEns(val.ensRegister)) return false;
  if (val.ensSetResolver && !Transitions.isEns(val.ensSetResolver)) return false;
  if (val.ensSetContent && !Transitions.isEns(val.ensSetContent)) return false; 
  return true;
}

export function newDeployItem():DeployItem {
  const now = Date.now().toString();
  return {
    ...newDeployArgs(),
    createdAt: now,
    updatedAt: now,
    username: '',
    state: DeployStates.FETCHING_SOURCE,
    codepipelineName: '',
  }
}

export namespace Transitions {
  interface Base {
    timestamp: string
  }

  type GenericTransition<Details> = Base & Details;

  export type Pipeline = GenericTransition<{
    size: number
  }>

  export function isPipeline(val:any):val is Pipeline {
    return (
      isObject(val) &&
      isString(val.timestamp) &&
      isNumber(val.size)
    )
  }

  export type Ipfs = GenericTransition<{ 
    hash: string
  }>

  export function isIpfs(val:any):val is Ipfs {
    return (
      isObject(val) &&
      isString(val.timestamp) &&
      isString(val.hash)
    )
  }

  export type Ens = GenericTransition<{
    txHash: string,
    nonce: number,
    blockNumber?: number,
    confirmationTimestamp?: string
  }>

  export function isEns(val:any): val is Ens {
    let base = (
      isObject(val) &&
      isString(val.timestamp) &&
      isString(val.txHash) &&
      isNumber(val.nonce)
    )
    if (!base) return false;
    if (
      // If either of these keys are set, they must both be
      // set correctly in order to pass.
      (val.blockNumber || val.confirmationTimestamp) &&
      (!isNumber(val.blockNumber) || !isString(val.confirmationTimestamp))
    ) return false;
    return true;
  }

}

export namespace GitTypes {
  export type Auth = OctokitOauthTypes.TokenAuthentication;
  export type User = Octokit.UsersGetAuthenticatedResponse;
  export type Repo = Octokit.ReposListForOrgResponseItem;
  export type Branch = Octokit.ReposListBranchesResponseItem;
}

export enum SourceProviders {
  GitHub = "GitHub"
}

export function isSourceProvider(val:string): val is SourceProviders {
  const providers = Object.values(SourceProviders) as string[];
  return providers.includes(val);
}

export enum DeployStates {
  FETCHING_SOURCE      = 'FETCHING_SOURCE',
  BUILDING_SOURCE      = 'BUILDING_SOURCE',
  DEPLOYING_IPFS       = 'DEPLOYING_IPFS',
  REGISTERING_ENS      = 'REGISTERING_ENS',
  SETTING_RESOLVER_ENS = 'SETTING_RESOLVER_ENS',
  SETTING_CONTENT_ENS  = 'SETTING_CONTENT_ENS',
  PROPAGATING          = 'PROPAGATING',
  AVAILABLE            = 'AVAILABLE'
}