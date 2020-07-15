import { pathExistsSync, readFileSync } from 'fs-extra';

import { execAsync, JovoTaskContextAlexa, getAskErrorV2 } from '../utils';

export async function getAccountLinkingInformation(ctx: JovoTaskContextAlexa, stage: string) {
  try {
    const cmd =
      'ask smapi get-account-linking-info ' +
      `-s ${ctx.skillId} ` +
      `-g ${stage} ` +
      `${ctx.askProfile ? `-p ${ctx.askProfile}` : ''}`;

    const stdout = await execAsync(cmd);
    const response = JSON.parse(stdout);

    return response.accountLinkingResponse;
  } catch (err) {
    if (err.code === 1) {
      return;
    }

    throw getAskErrorV2('smapiGetAccountLinkingInformation', err.message);
  }
}

export async function updateAccountLinkingInformation(
  ctx: JovoTaskContextAlexa,
  accountLinkingJsonPath: string,
  stage: string,
) {
  try {
    if (!pathExistsSync(accountLinkingJsonPath)) {
      return;
    }

    const cmd =
      'ask smapi update-account-linking-info ' +
      `-s ${ctx.skillId} ` +
      `-g ${stage} ` +
      `${ctx.askProfile ? `-p ${ctx.askProfile}` : ''} ` +
      `--account-linking-request "file:${accountLinkingJsonPath}"`;

    await execAsync(cmd);
  } catch (err) {
    throw getAskErrorV2('smapiUpdateAccountLinkingInformation', err.message);
  }
}
