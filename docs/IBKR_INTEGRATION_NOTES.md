# IBKR Integration Research

## Overview
Interactive Brokers (IBKR) is a critical integration for professional trading. Unlike Alpaca (modern, API-first), IBKR supports a vast range of asset classes and global markets.

## Integration Methods

### 1. TWS / IB Gateway (Desktop/Server)
- **Architecture**: Requires a Java processes (`IB Gateway` or `TWS`) running on a server/local machine.
- **Protocol**: TCP Socket.
- **Pros**: Full feature set, real-time streaming (high freq).
- **Cons**: Not friendly to Cloudflare Workers (serverless). Requires a persistent "sidecar" server (EC2/Docker) to bridge WebSocket/TCP to the Worker.
- **Verdict**: Unsuitable for pure serverless, unless users run a local bridge (e.g. `IBKR-to-HTTP` local agent).

### 2. Client Portal API (Web API)
- **Architecture**: RESTful API.
- **Protocol**: HTTP / WebSocket (for data).
- **Cons**: Historically required a local Java gateway ("CP Gateway") too, BUT they have an OAuth flow for partners.
- **Pros**: Native HTTP.

### 3. OAuth (Third Party Integration)
- **Architecture**: True cloud-to-cloud integration.
- **Flow**: User logs in to IBKR -> Redirects to StockCommand.
- **Mechanism**: StockCommand receives an OAuth token to make API calls on user's behalf via Client Portal API.
- **Requirement**: Must apply for **IBKR Third Party Integration**.
- **Reference**: [IBKR Third Party Integration](https://www.interactivebrokers.com/en/index.php?f=46896)

## Implementation Strategy for StockCommand (Serverless)

### Approach A: The "Partner" Route (OAuth) - **MANDATORY**
1. Apply for IBKR Third Partner integration.
2. Implement OAuth flow (strictly supported by Cloudflare).
3. Call Client Portal API endpoints with Token.
- **User Experience**: Zero skill. Login and trade.

### Approach B: The "Local Bridge" Route (User Hosted)
> **REJECTED**: Violates "Zero Skill" requirement. Users cannot be expected to run Docker containers.
- ~~User installs a Docker container or Local App.~~
- ~~Bridge runs IB Gateway.~~

## Action Items for Phase 6
1. [ ] **Apply for IBKR Third Partner Integration** (Critical Path).
2. [ ] Research CPAPI OAuth specs.
3. [ ] Scaffold `lib/brokers/ibkr/` for OAuth flow only.

## Useful Links
- [IBKR Third Party Connections](https://www.interactivebrokers.com/campus/ibkr-api-page/third-party-connections/)
- [CPAPI Documentation](https://interactivebrokers.github.io/cpwebapi/)
