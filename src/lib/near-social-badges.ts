// near-social-badges.ts

// Import necessary modules from near-social-js
import { Social } from "@builddao/near-social-js";
// Import the Badge interface from badge.ts
import { Badge } from "./badge";

// Initialize the SocialContract instance
const social = new Social();

// Function to compute badges based on user activity
export const computeSocialBadges = async (
  accountId: string
): Promise<Badge[]> => {
  try {
    // Retrieve user activity data
    const followers = Object.values(
      await social.keys({
        keys: [`*/graph/follow/${accountId}`],
        valuesOnly: true,
      })
    );

    // Define badge computation logic
    const badges: Badge[] = [
      followers.length <= 5
        ? {
            name: "Social Noob",
            description: `You have ${followers.length} follower${
              followers.length !== 1 ? "s" : ""
            }`,
            karma: followers.length,
          }
        : followers.length <= 10
        ? {
            name: "Social Friend",
            description: `You have ${followers.length} followers`,
            karma: followers.length,
          }
        : followers.length <= 90
        ? {
            name: "Social Earner",
            description: `You have ${followers.length} followers`,
            karma: 5 + Math.floor(followers.length / 2),
          }
        : {
            name: "Social Influencer",
            description: `You have ${followers.length} followers`,
            karma: 20 + Math.floor(followers.length / 3),
          },
    ].filter((badge): badge is Badge => badge !== null);

    return badges;
  } catch (error) {
    console.error("Error computing badges:", error);
    return [];
  }
};
