// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RewardDistributor is Ownable {
    using SafeERC20 for IERC20;

    event Deposit(address user, uint256 amount);
    event Withdraw(address user, uint256 amount);

    IERC20 public tkn;

    mapping(address => uint256) public scaledBalanceOf;
    uint256 public scaledTotalSupply;

    constructor(address _tkn) {
        tkn = IERC20(_tkn);
    }

    function deposit(uint256 _amount) external {
        uint256 scaledAmount = calcScalableAmount(_amount);
        scaledBalanceOf[msg.sender] += scaledAmount;
        scaledTotalSupply += scaledAmount;

        tkn.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external {
        uint256 scaledAmount = calcScalableAmount(_amount);
        require(scaledBalanceOf[msg.sender] >= scaledAmount, "invalid amount");
        scaledBalanceOf[msg.sender] -= scaledAmount;
        scaledTotalSupply -= scaledAmount;

        tkn.safeTransfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _amount);
    }

    function balanceOf(address _user) external view returns (uint256) {
        if (scaledTotalSupply == 0 || totalSupply() == 0) {
            return 0;
        }

        return (scaledBalanceOf[_user] * totalSupply()) / scaledTotalSupply;
    }

    function totalSupply() public view returns (uint256) {
        return tkn.balanceOf(address(this));
    }

    function calcScalableAmount(uint256 _amount)
        internal
        view
        returns (uint256 scaledAmount)
    {
        if (scaledTotalSupply == 0 || totalSupply() == 0) {
            return _amount;
        }

        scaledAmount = (_amount * scaledTotalSupply) / totalSupply();

        // consider of arithmatical overflow/underflow
        if ((scaledAmount * totalSupply()) / scaledTotalSupply < _amount) {
            scaledAmount++;
        }
    }
}
