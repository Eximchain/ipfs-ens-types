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

export function isDeployArgs(val: any): val is DeployArgs {
  return keysAreStrings(val, ['packageDir', 'buildDir', 'owner', 'repo', 'branch', 'ensName', 'sourceProvider'])
}

export function newDeployArgs(): DeployArgs {
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

export function isDeployItem(val: any): val is DeployItem {
  if (!keysAreStrings(val, [
    ...Object.keys(newDeployArgs()),
    'createdAt', 'updatedAt', 'username', 'codepipelineName'
  ])) return false;
  if (!isObject(val.transitions)) return false;
  const trans = val.transitions;
  if (trans.source && !Transitions.isPipeline(trans.source)) return false;
  if (trans.build && !Transitions.isPipeline(trans.build)) return false;
  if (trans.ipfs && !Transitions.isIpfs(trans.ipfs)) return false;
  if (trans.ensRegister && !Transitions.isEns(trans.ensRegister)) return false;
  if (trans.ensSetResolver && !Transitions.isEns(trans.ensSetResolver)) return false;
  if (trans.ensSetContent && !Transitions.isEns(trans.ensSetContent)) return false;
  return true;
}

export function newDeployItem(): DeployItem {
  const now = Date.now().toString();
  return {
    ...newDeployArgs(),
    createdAt: now,
    updatedAt: now,
    username: '',
    state: DeployStates.FETCHING_SOURCE,
    codepipelineName: '',
    transitions: {}
  }
}

export namespace Transitions {

  export namespace Names {
    export enum All {
      SOURCE = 'source',
      BUILD = 'build',
      IPFS = 'ipfs',
      ENS_REGISTER = 'ensRegister',
      ENS_SET_RESOLVER = 'ensSetResolver',
      ENS_SET_CONTENT = 'ensSetContent'
    }

    export type Pipeline = All.SOURCE | All.BUILD;

    export type Ipfs = All.IPFS;

    export type Ens = All.ENS_REGISTER | All.ENS_SET_RESOLVER | All.ENS_SET_CONTENT;
  }

  interface Base {
    timestamp: string
  }

  type GenericTransition<Details> = Base & Details;

  export type Pipeline = GenericTransition<{
    size: number
  }>

  export function isPipeline(val: any): val is Pipeline {
    return (
      isObject(val) &&
      isString(val.timestamp) &&
      isNumber(val.size)
    )
  }

  export type Ipfs = GenericTransition<{
    hash: string
  }>

  export function isIpfs(val: any): val is Ipfs {
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

  export function isEns(val: any): val is Ens {
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
  type TokenWithScopes = {
    token: string;
    scopes: string[];
  };
  type TokenAuthentication = TokenWithScopes & {
    type: "token";
    tokenType: "oauth";
  };

  export type Auth = TokenAuthentication;
  export type User = Octokit.UsersGetAuthenticatedResponse;
  export type Repo = Octokit.ReposListForOrgResponseItem;
  export type Branch = Octokit.ReposListBranchesResponseItem;
}

export enum SourceProviders {
  GitHub = "GitHub"
}

export function isSourceProvider(val: string): val is SourceProviders {
  const providers = Object.values(SourceProviders) as string[];
  return providers.includes(val);
}

export enum DeployStates {
  FETCHING_SOURCE = 'FETCHING_SOURCE',
  BUILDING_SOURCE = 'BUILDING_SOURCE',
  DEPLOYING_IPFS = 'DEPLOYING_IPFS',
  REGISTERING_ENS = 'REGISTERING_ENS',
  SETTING_RESOLVER_ENS = 'SETTING_RESOLVER_ENS',
  SETTING_CONTENT_ENS = 'SETTING_CONTENT_ENS',
  PROPAGATING = 'PROPAGATING',
  AVAILABLE = 'AVAILABLE'
}