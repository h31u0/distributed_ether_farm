# distributed_ether_farm
## Introduction
Decentralized applications: We propose to build a game like FarmVille on blockchains. In the game, each user owns farmland where a user can plant, grow and harvest crops. A user can add friends with another user and steal his/her friend's mature crops. Each crop is represented by a token and can be kept by the user after it's harvested. Users can trade the tokens they have with each other. Additionally, a front end will be implemented to display the status of the farmland, to visualize crops a user has, and to keep track of transaction histories.
## Methodology

In this project we would like to build a DAPP game to combine traditional business simulation game with blockchain technology.
This project involves environment setup, smart contract development and frontend development.

The basic technique we would implement can be summarized as follows:
    1. we would setup an environment to simulate a chain
    2. we would implement some token based game items, and implement some basic game interactions, such as items exchange, harvesting items. 
    3. we would write a frontend to interact with the smart contract.
### Environment set up:
    we would like to use remix on local full node to test our smart contract with web3.js and frontend
### Smart contract:
    we would like to implement plant, grow and harvest crops, and crops tread
### Frontend:
    we would like to Truffle framework to build the frontend of the game.

## Evaluation
We will mainly perform gameplay test to evaluate the decentralized video game that we develop. We will prepare a test plan with a set of delicated tests to evaluate all features in the game. For instance, the time taken to grow crops will be reduced to a few seconds during the evaluation, so that the harvest operation can be evaluated within a short amount of time. The front end display will be evaluated by manually checking whether there is some display issues. We will also use some third-party or self-implemented tools to check if the blocks are attached to the chain properly.

Since our plan is to setup a private environment for the game instead of uploading it to the public chain, we may not be able to perform a load test. We will still evaluate the game by having multiple players to play at the same time.
## Timelines
We plan to split the development into two main parts: frontend and backend. We will spend about 3 days to design the interface that the frontend uses to communicate with the backend. And then, in the next 2 weeks, one member will work on the frontend, and the other two members will work on the backend. The next 2 to 3 days will be used for integration and basic testing, and the rest of the time will be spent for evaluation.
