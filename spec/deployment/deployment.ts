import OctokitOauthTypes from '@octokit/auth-oauth-app/dist-types/types';
import Octokit from '@octokit/rest';
import { keysAreStrings } from '@eximchain/api-types/spec/validators'

/**
 * Barebones arguments required to create a deployment.
 * Sent to us by client, persisted in S3.
 */
export interface DeployArgs {
  buildDir: string
  owner: string
  repo: string
  branch: string
  ensName: string
}

export function isDeployArgs(val:any): val is DeployArgs {
  return keysAreStrings(val, ['buildDir', 'owner', 'repo', 'branch', 'ensName'])
}

export function newDeployArgs():DeployArgs{
  return {
    buildDir: '',
    owner: '',
    repo: '',
    branch: '',
    ensName: ''
  }
}

/**
 * Complete data representing a deployment, persisted
 * in our DynamoDB records.
 */
export interface DeployItem extends DeployArgs {
  createdAt: string
  updatedAt: string
}

export function isDeployItem(val:any): val is DeployItem {
  return (
    isDeployArgs(val) &&
    keysAreStrings(val, ['createdAt', 'updatedAt'])
  )
}

export function newDeployItem():DeployItem {
  const now = Date.now().toString();
  return {
    ...newDeployArgs(),
    createdAt: now,
    updatedAt: now
  }
}

export namespace GitTypes {
  export type Auth = OctokitOauthTypes.TokenAuthentication;
  export type User = Octokit.UsersGetAuthenticatedResponse;
  export type Repo = Octokit.ReposListForOrgResponseItem;
  export type Branch = Octokit.ReposListBranchesResponseItem;
}