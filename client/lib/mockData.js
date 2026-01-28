// Mock data and simulation functions for Soroban DAO

// Simulated wallet address
export const MOCK_WALLET = "GBXYZ...ABC123";
export const MOCK_ADMIN = "GADMIN...XYZ789";

// Initial mock DAOs
const initialDAOs = [
  {
    dao_name: "TechDAO",
    dao_des: "A decentralized community for tech enthusiasts to vote on emerging technology adoption and funding proposals.",
    dao_owner: "GOWNER1...ABC",
    dao_deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    yes: 42,
    no: 15,
    total_votes: 57,
  },
  {
    dao_name: "ArtDAO",
    dao_des: "Supporting digital artists through community-driven funding and exhibition decisions.",
    dao_owner: "GOWNER2...DEF",
    dao_deadline: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
    yes: 89,
    no: 23,
    total_votes: 112,
  },
  {
    dao_name: "GameDAO",
    dao_des: "Governance for indie game development funding and feature prioritization.",
    dao_owner: "GOWNER3...GHI",
    dao_deadline: Date.now() - 2 * 24 * 60 * 60 * 1000, // Expired 2 days ago
    yes: 156,
    no: 44,
    total_votes: 200,
  },
  {
    dao_name: "EcoDAO",
    dao_des: "Environmental initiatives voting platform for sustainable project funding.",
    dao_owner: MOCK_WALLET, // Owned by current user
    dao_deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    yes: 78,
    no: 12,
    total_votes: 90,
  },
];

// Store data in memory (simulating blockchain state)
let daos = [...initialDAOs];
let votedMap = new Map(); // "dao_name:voter_address" -> true
let stats = {
  totalDao: 4,
  totalVote: 459,
  totalDonate: 15000000000, // 1500 XLM in stroops (1 XLM = 10^7 stroops)
  contractBalance: 15000000000,
};

// Helper to format stroops to XLM
export const stroopsToXLM = (stroops) => {
  return (stroops / 10000000).toFixed(2);
};

// Helper to format XLM to stroops
export const xlmToStroops = (xlm) => {
  return Math.floor(xlm * 10000000);
};

// Get all DAOs
export const getAllDAOs = () => {
  return [...daos];
};

// Get single DAO by name
export const getDAO = (daoName) => {
  return daos.find((d) => d.dao_name === daoName) || null;
};

// Create new DAO
export const createDAO = (daoName, description, owner, deadline) => {
  // Check if already exists
  if (daos.find((d) => d.dao_name === daoName)) {
    throw new Error("DAO already exists! Try a different name.");
  }

  if (deadline <= Date.now()) {
    throw new Error("Deadline must be in the future");
  }

  const newDAO = {
    dao_name: daoName,
    dao_des: description,
    dao_owner: owner,
    dao_deadline: deadline,
    yes: 0,
    no: 0,
    total_votes: 0,
  };

  daos.push(newDAO);
  stats.totalDao += 1;

  return newDAO;
};

// Update DAO
export const updateDAO = (daoName, owner, newDescription, newDeadline) => {
  const dao = daos.find((d) => d.dao_name === daoName);
  
  if (!dao) {
    throw new Error("DAO not found!");
  }

  if (dao.dao_owner !== owner) {
    throw new Error("Only DAO owner can update!");
  }

  if (newDeadline <= Date.now()) {
    throw new Error("Deadline must be in the future");
  }

  dao.dao_des = newDescription;
  dao.dao_deadline = newDeadline;

  return dao;
};

// Delete DAO
export const deleteDAO = (daoName, owner) => {
  const daoIndex = daos.findIndex((d) => d.dao_name === daoName);
  
  if (daoIndex === -1) {
    throw new Error("DAO not found!");
  }

  if (daos[daoIndex].dao_owner !== owner) {
    throw new Error("Only DAO owner can delete!");
  }

  daos.splice(daoIndex, 1);
  stats.totalDao -= 1;

  return true;
};

// Vote on DAO
export const voteDAO = (voter, daoName, choice) => {
  const dao = daos.find((d) => d.dao_name === daoName);
  
  if (!dao) {
    throw new Error("DAO not found!");
  }

  if (dao.dao_owner === voter) {
    throw new Error("DAO creator cannot vote on their own DAO!");
  }

  const voteKey = `${daoName}:${voter}`;
  if (votedMap.has(voteKey)) {
    throw new Error("You have already voted on this DAO!");
  }

  if (dao.dao_deadline <= Date.now()) {
    throw new Error("DAO deadline has passed!");
  }

  if (choice !== "yes" && choice !== "no") {
    throw new Error("Invalid choice! Use 'yes' or 'no'");
  }

  if (choice === "yes") {
    dao.yes += 1;
  } else {
    dao.no += 1;
  }
  dao.total_votes += 1;
  stats.totalVote += 1;

  votedMap.set(voteKey, true);

  return dao;
};

// Check if user has voted
export const hasVoted = (daoName, voter) => {
  return votedMap.has(`${daoName}:${voter}`);
};

// Donate
export const donate = (amount) => {
  if (amount <= 0) {
    throw new Error("Donation amount must be greater than 0");
  }

  const stroops = xlmToStroops(amount);
  stats.totalDonate += stroops;
  stats.contractBalance += stroops;

  return stats.totalDonate;
};

// Withdraw (admin only)
export const withdraw = (admin, amount) => {
  if (admin !== MOCK_ADMIN) {
    throw new Error("Only admin can withdraw!");
  }

  if (amount <= 0) {
    throw new Error("Withdrawal amount must be greater than 0");
  }

  const stroops = xlmToStroops(amount);
  
  if (stroops > stats.contractBalance) {
    throw new Error("Insufficient contract balance");
  }

  stats.contractBalance -= stroops;

  return stats.contractBalance;
};

// Get stats
export const getStats = () => {
  return {
    totalDao: stats.totalDao,
    totalVote: stats.totalVote,
    totalDonate: stroopsToXLM(stats.totalDonate),
    contractBalance: stroopsToXLM(stats.contractBalance),
  };
};

// Get admin
export const getAdmin = () => {
  return MOCK_ADMIN;
};

// Format deadline to readable string
export const formatDeadline = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Check if deadline has passed
export const isExpired = (timestamp) => {
  return timestamp <= Date.now();
};

// Get time remaining
export const getTimeRemaining = (timestamp) => {
  const diff = timestamp - Date.now();
  
  if (diff <= 0) {
    return "Expired";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
};
