import { Badge } from "@/lib/badge";

export interface NearBlocksAccount {
  amount?: string;
  block_hash?: string;
  block_height?: number;
  code_hash?: string;
  locked?: string;
  storage_paid_at?: number;
  storage_usage?: number;
  account_id?: string;
  created?: {
    transaction_hash?: string;
    block_timestamp?: number;
  };
  deleted?: {
    transaction_hash?: string | null;
    block_timestamp?: number | null;
  };
}

interface AccountResponse {
  account: NearBlocksAccount[];
}

interface TxnsCountResponse {
  txns: [
    {
      count: string;
    }
  ];
}

export type NearBlocksAccountData = {
  accountData: NearBlocksAccount;
  txnsCount: number;
};

export async function getNearBlocksAccountData(
  accountId: string
): Promise<NearBlocksAccountData> {
  const [accountResponse, txnsResponse] = await Promise.all([
    fetch(`https://api.nearblocks.io/v1/account/${accountId}`),
    fetch(`https://api.nearblocks.io/v1/account/${accountId}/txns/count`),
  ]);

  const accountData = (await accountResponse.json()) as AccountResponse;
  const txnsData = (await txnsResponse.json()) as TxnsCountResponse;

  return {
    accountData: accountData.account[0],
    txnsCount: parseInt(txnsData.txns[0].count),
  };
}

function getAccountAgeInDays(createdTimestamp: number | undefined): number {
  if (!createdTimestamp) return 0;
  const createdDate = new Date(createdTimestamp / 1_000_000);
  console.log("Created Date", createdDate);
  const now = new Date();
  return Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getKarmaForAge(ageInDays: number): number {
  if (ageInDays > 365 * 2) return 5; // 2+ years
  if (ageInDays > 365) return 4; // 1+ year
  if (ageInDays > 180) return 3; // 6+ months
  if (ageInDays > 90) return 2; // 3+ months
  if (ageInDays > 30) return 1; // 1+ month
  return 0;
}

function getKarmaForTransactions(txnsCount: number): number {
  if (txnsCount > 500) return 5;
  if (txnsCount > 200) return 4;
  if (txnsCount > 100) return 3;
  if (txnsCount > 50) return 2;
  if (txnsCount > 10) return 1;
  return 0;
}

export async function getNearBlocksBadges(accountId: string): Promise<Badge[]> {
  const data = await getNearBlocksAccountData(accountId);
  console.log(JSON.stringify(data, null, 2));
  const badges: Badge[] = [];
  console.log("Created", data?.accountData?.created);
  const ageInDays = getAccountAgeInDays(
    data?.accountData?.created?.block_timestamp
  );

  // Account Age Badge
  if (ageInDays > 0) {
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    const description =
      years > 0
        ? `Account is ${years} year${years > 1 ? "s" : ""} old`
        : `Account is ${months} month${months > 1 ? "s" : ""} old`;

    badges.push({
      name: "Account Veteran",
      description,
      karma: getKarmaForAge(ageInDays),
    });
  }

  // Transaction Activity Badge
  if (data.txnsCount > 0) {
    badges.push({
      name: "Active Account",
      description: `Account has made ${data.txnsCount} transactions`,
      karma: getKarmaForTransactions(data.txnsCount),
    });
  }

  return badges;
}
