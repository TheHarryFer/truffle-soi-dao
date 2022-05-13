pragma solidity ^0.5.0;

contract PickStar {
  address payable public owner;
  address[27] public stars;
  mapping(address => uint256) public payment;

  constructor() public {
    owner = msg.sender;
  }

  // buying a star
  function buyStar(uint starId, uint256 _amount) public payable returns (uint) {
    require(msg.value == _amount && msg.value > 0);
    require(starId >= 0 && starId <= 26);

    stars[starId] = msg.sender;

    payment[msg.sender] += msg.value;
    //owner.transfer(msg.value);

    return starId;
  }

  function getStars() public view returns (address[27] memory) {
    return stars;
  }
}
