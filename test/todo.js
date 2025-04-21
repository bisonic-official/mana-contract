// CONTRACT UPDATES
// CHECKED: Add IERC20 contract setters
// CHECKED: Withdrawal functions should also move other tokens
// CHECKED: Add bools to disable token payments
// CHECKED: Mock ERC20 tests
// CHECKED: Verify USDC conversion
// CHECKED: Add non reentrancy to contract
// CHECKED: Add bounds for package index
// CHECKED: Add quantity check
// CHECKED: Add contractFeedID to contract.
// CHECKED: Create getter/setter for contractFeedID.
// CHECKED: Create getter/setter for pyth address.
// CHECKED: Create getter/setter for PIXEL contract address.
// CHECKED: Create getter/setter for Crypto token discount.
// CHECKED: Create getter/setter for USDC token discount.
// CHECKED: Create getter/setter for PIXEL token discount.
// CHECKED: Create a wallet address that is allowed to modify the pixel price.
// CHECKED: Create the method to modify the pixel price (only allowed by that wallet).
// CHECKED: Create getter/setter (onlyOwner) for updater address (for Pixel price).
// CHECKED: Use the USDC payment as base to implement the pixel one.
// CHECKED: Add payment lock for PIXEL.
// CHECKED: Add discount to Crypto token in payment.
// CHECKED: Add discount to USDC token in payment.
// CHECKED: Add discount to PIXEL token in payment.
// CHECKED: Add withdrawal functions for PIXEL.
// CHECKED: Find a web service to query the PIXEL price.
// CHECKED: Create a cron that modifies the PIXEL price (it will have the private key of the allowed address).

// TESTS
// CHECKED: Test get/set of token address
// CHECKED: Test get/set feedIds
// CHECKED: Test lock of functions
// CHECKED: Test purchasePackage and reverts
// CHECKED: Test purchasePackageWithUSDC and reverts <- Allowance needed
// CHECKED: Test withdrawal functions USDC
// CHECKED: Test withdrawal functions crypto
// CHECKED: Test getter/setter for contractFeedID.
// CHECKED: Test getter/setter for pyth address.
