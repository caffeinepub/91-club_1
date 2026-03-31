import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Map "mo:core/Map";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserProfile = {
    principal : Principal;
    username : Text;
    balance : Nat;
    totalBets : Nat;
    totalWins : Nat;
    lastDailyBonus : Int;
    referralCode : Text;
  };

  type Period = {
    id : Nat;
    startTime : Int;
    result : Nat;
    status : Text;
  };

  module Period {
    public func compare(period1 : Period, period2 : Period) : Order.Order {
      Nat.compare(period1.id, period2.id);
    };
  };

  type Bet = {
    id : Nat;
    user : Principal;
    periodId : Nat;
    betType : Text;
    betValue : Text;
    stakeAmount : Nat;
    multiplier : Nat;
    outcome : Text;
    payout : Nat;
  };

  module Bet {
    public func compare(bet1 : Bet, bet2 : Bet) : Order.Order {
      Nat.compare(bet1.id, bet2.id);
    };
  };

  let users = List.empty<UserProfile>();
  let periods = List.fromArray<Period>([{
    id = 0;
    startTime = Time.now();
    result = 0;
    status = "open";
  }]);
  let bets = List.empty<Bet>();

  func getCurrentPeriodInternal() : Period {
    switch (periods.last()) {
      case (?period) { period };
      case (null) { Runtime.trap("No current period found") };
    };
  };

  // Public: Anyone can register. Directly adds the #user role to bypass admin check.
  public shared ({ caller }) func register(username : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Cannot register as anonymous");
    };
    if (users.values().any(func(u) { u.principal == caller })) {
      Runtime.trap("User already exists");
    };
    let referralCode = username # "." # caller.toText();
    let user : UserProfile = {
      principal = caller;
      username;
      balance = 1000;
      totalBets = 0;
      totalWins = 0;
      lastDailyBonus = 0;
      referralCode;
    };
    users.add(user);
    // Directly insert role into the map (bypasses admin-only check in assignRole)
    accessControlState.userRoles.add(caller, #user);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view profile");
    };
    users.find(func(u) { u.principal == caller });
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can save profile");
    };
    if (profile.principal != caller) {
      Runtime.trap("Unauthorized: Cannot update another user's profile");
    };
    users.add(profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.find(func(u) { u.principal == user });
  };

  public query ({ caller }) func getProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view profile");
    };
    switch (users.find(func(u) { u.principal == caller })) {
      case (?user) { user };
      case (null) { Runtime.trap("No user found") };
    };
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view balance");
    };
    switch (users.find(func(u) { u.principal == caller })) {
      case (?user) { user.balance };
      case (null) { Runtime.trap("No user found") };
    };
  };

  public shared ({ caller }) func placeBet(betType : Text, betValue : Text, stakeAmount : Nat, multiplier : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can place bets");
    };
    if (stakeAmount == 0) {
      Runtime.trap("Stake amount cannot be zero");
    };
    let user = switch (users.find(func(u) { u.principal == caller })) {
      case (?user) { user };
      case (null) { Runtime.trap("User does not exist") };
    };
    if (user.balance < stakeAmount) {
      Runtime.trap("Insufficient balance");
    };
    let updatedUser = {
      principal = user.principal;
      username = user.username;
      balance = user.balance - stakeAmount;
      totalBets = user.totalBets + 1;
      totalWins = user.totalWins;
      lastDailyBonus = user.lastDailyBonus;
      referralCode = user.referralCode;
    };
    users.add(updatedUser);
    let currentPeriod = getCurrentPeriodInternal();
    if (currentPeriod.status != "open") {
      Runtime.trap("Current period is not open for bets");
    };
    let bet : Bet = {
      id = bets.size();
      user = caller;
      periodId = currentPeriod.id;
      betType;
      betValue;
      stakeAmount;
      multiplier;
      outcome = "pending";
      payout = 0;
    };
    bets.add(bet);
  };

  public shared ({ caller }) func finalizePeriod() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can finalize periods");
    };
    let currentPeriod = getCurrentPeriodInternal();
    if (currentPeriod.status != "open") {
      Runtime.trap("Current period is already closed");
    };
    let randomSeed = Int.abs(Time.now()) % 10;
    let result = Int.abs(randomSeed);
    let closedPeriod : Period = {
      id = currentPeriod.id;
      startTime = currentPeriod.startTime;
      result = result;
      status = "closed";
    };
    periods.add(closedPeriod);
    for (bet in bets.values()) {
      if (bet.periodId == currentPeriod.id and bet.outcome == "pending") {
        var isWin = false;
        var payout = 0;
        if (bet.betType == "number") {
          if (bet.betValue == result.toText()) {
            isWin := true;
            payout := bet.stakeAmount * 9;
          };
        } else if (bet.betType == "color") {
          if (bet.betValue == "Green" and (result == 1 or result == 3 or result == 7 or result == 9)) {
            isWin := true;
            payout := bet.stakeAmount * 2;
          } else if (bet.betValue == "Red" and (result == 2 or result == 4 or result == 6 or result == 8)) {
            isWin := true;
            payout := bet.stakeAmount * 2;
          } else if (bet.betValue == "Violet" and (result == 0 or result == 5)) {
            isWin := true;
            payout := bet.stakeAmount * 9;
          };
        };
        let updatedBet : Bet = {
          id = bet.id;
          user = bet.user;
          periodId = bet.periodId;
          betType = bet.betType;
          betValue = bet.betValue;
          stakeAmount = bet.stakeAmount;
          multiplier = bet.multiplier;
          outcome = if (isWin) { "win" } else { "lose" };
          payout = payout;
        };
        bets.add(updatedBet);
        if (isWin) {
          switch (users.find(func(u) { u.principal == bet.user })) {
            case (?user) {
              let updatedUser = {
                principal = user.principal;
                username = user.username;
                balance = user.balance + payout;
                totalBets = user.totalBets;
                totalWins = user.totalWins + 1;
                lastDailyBonus = user.lastDailyBonus;
                referralCode = user.referralCode;
              };
              users.add(updatedUser);
            };
            case (null) {};
          };
        };
      };
    };
    let newPeriod : Period = {
      id = currentPeriod.id + 1;
      startTime = Time.now();
      result = 0;
      status = "open";
    };
    periods.add(newPeriod);
  };

  public query ({ caller }) func getCurrentPeriod() : async (Nat, Text) {
    let period = getCurrentPeriodInternal();
    (period.id, period.status);
  };

  public query ({ caller }) func getGameHistory() : async [Period] {
    periods.values().toArray().sort().reverse().sliceToArray(0, Nat.min(20, periods.size()));
  };

  public query ({ caller }) func getMyBets() : async [Bet] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view their bets");
    };
    bets.values().toArray().filter(func(b) { b.user == caller }).sort().reverse().sliceToArray(0, Nat.min(20, bets.size()));
  };

  public shared ({ caller }) func claimDailyBonus() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can claim daily bonus");
    };
    let today = Time.now() / 86400000000000;
    switch (users.find(func(u) { u.principal == caller })) {
      case (?user) {
        if (user.lastDailyBonus == today) {
          Runtime.trap("Daily bonus already claimed today");
        };
        let updatedUser = {
          principal = user.principal;
          username = user.username;
          balance = user.balance + 100;
          totalBets = user.totalBets;
          totalWins = user.totalWins;
          lastDailyBonus = today;
          referralCode = user.referralCode;
        };
        users.add(updatedUser);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };
};
