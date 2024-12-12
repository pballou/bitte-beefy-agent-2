import { Badge } from "@/lib/badge";
import Big from "big.js";
import { allowlistedTokens, AllowlistedToken } from "./allowlist-tokens";

const WRAP_NEAR_CONTRACT_ID = "wrap.near";
const MIN_BALANCE_THRESHOLD = 1e-3;

export type FastNearAccountData = {
  account_id: string;
  state: {
    balance: string;
    locked: string;
    storage_bytes: number;
  };
  nfts: {
    contract_id: string;
    last_update_block_height: number | null;
  }[];
  tokens: {
    contract_id: string;
    balance: string;
    last_update_block_height: number | null;
  }[];
  pools: {
    pool_id: string;
    last_update_block_height: number | null;
  }[];
};

type FastNeatBadgeFactory = (data: FastNearAccountData) => Badge[];

export const getAllowlistedTokenBadges: FastNeatBadgeFactory = (data) => {
  const badges: Badge[] = [];

  for (const tokenData of data.tokens) {
    const token: AllowlistedToken = allowlistedTokens[tokenData.contract_id];
    if (!token) continue;
    if (
      Big(tokenData.balance)
        .div(Big(10).pow(token.decimals))
        .lt(MIN_BALANCE_THRESHOLD)
    )
      continue;
    badges.push({
      name: `Holder of ${token.symbol}`,
      description: `You hold the token ${token.name} (${token.symbol})${
        token.reference ? `. Reference: ${token.reference}` : ""
      }`,
      contractId: tokenData.contract_id,
      karma: token.karma !== undefined ? token.karma : 1,
      minBalance: MIN_BALANCE_THRESHOLD,
    });
  }

  return badges;
};

const allBadges: FastNeatBadgeFactory[] = [
  (data) =>
    data.state.storage_bytes > 1000000
      ? [
          {
            name: "Storage hoarder",
            description: "You have more than 1MB of storage on your account",
            karma: 10,
          },
        ]
      : [],
  (data) =>
    Big(data.state.balance).div(1e24).gte(MIN_BALANCE_THRESHOLD)
      ? [
          {
            name: "NEAR Holder",
            description: `You hold ${Big(data.state.balance)
              .div(1e24)
              .toFixed(2)} NEAR`,
            karma: Big(data.state.balance).div(1e24).lt(1)
              ? 1
              : Big(data.state.balance).div(1e24).lt(10)
              ? 2
              : Big(data.state.balance).div(1e24).lt(100)
              ? 3
              : Big(data.state.balance).div(1e24).lt(1000)
              ? 4
              : 5,
            minBalance: MIN_BALANCE_THRESHOLD,
          },
        ]
      : [],
  (data) =>
    data.tokens
      .filter((token) => token.contract_id === WRAP_NEAR_CONTRACT_ID)
      .some((token) => Big(token.balance).gt(0.001))
      ? [
          {
            name: "Wrapper",
            description: "You have wrapped NEAR",
            karma: 1,
          },
        ]
      : [],
  (data) =>
    data.nfts.length > 0
      ? [
          {
            name: "NFT Collector",
            description: `You own ${data.nfts.length} NFT${
              data.nfts.length > 1 ? "s" : ""
            }`,
            karma: getKarmaForNfts(data.nfts),
          },
        ]
      : [],
  (data) =>
    data.pools.length > 0
      ? [
          {
            name: "Staker",
            description: "You have staked NEAR",
            karma: 2,
          },
        ]
      : [],
  getAllowlistedTokenBadges,
  // TODO: Add more badges
];

export const getFastNearBadges = async (
  accountId: string
): Promise<Badge[]> => {
  const data = await getFastNearAccountData(accountId);
  return allBadges.flatMap((fn) => fn(data));
};

async function getFastNearAccountData(
  accountId: string
): Promise<FastNearAccountData> {
  const response = await fetch(
    `https://api.fastnear.com/v1/account/${accountId}/full`
  );
  return (await response.json()) as FastNearAccountData;
}

function getKarmaForNfts(
  nfts: { contract_id: string; last_update_block_height: number | null }[]
): number {
  if (nfts.length > 20) return 5;
  if (nfts.length > 10) return 4;
  if (nfts.length > 5) return 3;
  if (nfts.length > 1) return 2;
  if (nfts.length === 1) return 1;
  return 0;
}
