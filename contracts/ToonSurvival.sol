// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToonSurvival is ERC721A, Ownable {
  using Strings for uint256;

  string public baseURI;
  string public hiddenURI;
  uint256 public cost = 0.1 ether;
  uint256 public maxSupply = 100;
  uint256 public maxMintAmount = 5;
  bool public paused = false;
  bool public revealed = false;

  constructor(
    string memory _initBaseURI,
    string memory _initHiddenURI
  ) ERC721A("Toon Survival", "TS") {
    baseURI = _initBaseURI;
    hiddenURI = _initHiddenURI;
  }

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  function _hiddenURI() internal view virtual returns (string memory) {
    return hiddenURI;
  }

  // public
  function mint(uint256 _mintAmount) public payable {
    uint256 supply = totalSupply();
    require(!paused);
    require(_mintAmount > 0);
    require(_mintAmount <= maxMintAmount);
    require(supply + _mintAmount <= maxSupply);

    if (msg.sender != owner()) {
      require(msg.value >= cost * _mintAmount);
    }

    for (uint256 i = 1; i <= _mintAmount; i++) {
      _safeMint(msg.sender, supply + i);
    }
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory currentBaseURI = revealed ? _baseURI() : _hiddenURI();

    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString()))
        : "";
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  function setHiddenURI(string memory _newHiddenURI) public onlyOwner {
    hiddenURI = _newHiddenURI;
  }

  function setCost(uint256 _cost) public onlyOwner() {
    cost = _cost;
  }

  function setMaxMintAmount(uint256 _maxMintAmount) public onlyOwner() {
    maxMintAmount = _maxMintAmount;
  }

  function pause(bool _state) public onlyOwner {
    paused = _state;
  }

  function setReveal(bool _revealed) public onlyOwner {
      revealed = _revealed;
  }

  function withdraw() public payable onlyOwner {
    (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
    require(success);
  }
}
