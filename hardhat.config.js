
    require("@nomiclabs/hardhat-waffle");

    const PRIVATE_KEY = "6dd8dcdad9c45ef40b905b22dfd1ec956ecf8071e5797fc80446862babe747a0";

    module.exports = {
        solidity: "0.8.2",
        networks: {

          hardhat: {
            forking: {
              url: "https://eth-goerli.g.alchemy.com/v2/75B6TaJ5SRabJe0Os-8tBH3KcXK0lW3a",
            }
          },

          goerli: {
            url: `https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
              accounts: [`${PRIVATE_KEY}`]
          }

      
      }
    };