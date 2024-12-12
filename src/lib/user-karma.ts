import { Badge } from "./badge";
import { getFastNearBadges } from "./fastnear-badges";
import { computeSocialBadges } from "./near-social-badges";
import { getNearBlocksBadges } from "./nearblocks-badges";

export interface KarmaResponse {
  accountId: string;
  badges: Badge[];
  karma: number;
}

export const getUserKarma = async (
  accountId: string
): Promise<KarmaResponse> => {
  // if account has no suffix, then append .near,
  // but only if no suffix present and if the account is not a hash
  if (!accountId.includes(".") && !/^[0-9a-fA-F]{64}$/.test(accountId)) {
    accountId = `${accountId}.near`;
  }

  const badges = [
    ...(await getFastNearBadges(accountId)),
    ...(await computeSocialBadges(accountId)),
    ...(await getNearBlocksBadges(accountId)),
  ];
  const karma = badges.reduce((total, badge) => total + badge.karma, 0);

  return {
    accountId: accountId,
    badges,
    karma,
  };
};
