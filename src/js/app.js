App = {
  web3Provider: null,
  contracts: {},
  stars_data: [],
  stars_display: [],

  init: async function () {
    // Load stars.
    $.getJSON("../stars.json", function (data) {
      stars_data = [...data];
      stars_display = [...stars_data];

      stars_display.sort(() => 0.5 - Math.random());
      App.showStars();
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("PickStar.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var PickStarArtifact = data;

      App.contracts.PickStar = TruffleContract(PickStarArtifact);

      // Set the provider for our contract
      App.contracts.PickStar.setProvider(App.web3Provider);

      // Set current balance
      App.myBalance();

      // Use our contract to retrieve and mark the bought star
      return App.markBought();
    });

    return App.bindEvents();
  },

  showStars: function () {
    var starsRow = $("#starsRow").empty();
    var starTemplate = $("#starTemplate");

    for (i = 0; i < stars_display.length; i++) {
      starTemplate.find(".panel-title").text(stars_display[i].name);
      starTemplate.find("img").attr("src", stars_display[i].picture);
      starTemplate
        .find(".star-constellation")
        .text(stars_display[i].constellation);
      starTemplate.find(".star-age").text(stars_display[i].age);
      starTemplate.find(".star-age-unit").text(stars_display[i].age_unit);
      starTemplate.find(".star-mass").text(stars_display[i].mass);
      starTemplate.find(".star-mass-unit").text(stars_display[i].mass_unit);
      starTemplate.find(".star-radius").text(stars_display[i].radius);
      starTemplate.find(".star-radius-unit").text(stars_display[i].radius_unit);
      starTemplate.find(".star-price").text(stars_display[i].price);
      starTemplate.find(".btn-buy").attr("data-id", stars_display[i].id);
      starTemplate.find(".btn-buy").attr("data-price", stars_display[i].price);

      starsRow.append(starTemplate.html());
    }
  },

  search: function () {
    var keyword = document.getElementById("star-keyword").value.toUpperCase();
    var sortBy = document.getElementById("star-sort-by").value;
    var arrangeBy = document.getElementById("star-arrange-by").value;

    stars_display = [...stars_data];

    if (keyword !== "") {
      stars_display = stars_display.filter(
        (star) =>
          star.name.toUpperCase().includes(keyword) ||
          star.constellation.toUpperCase().includes(keyword)
      );
    }

    if (sortBy !== "none") {
      stars_display.sort((a, b) => {
        if (arrangeBy === "asc") {
          return a[sortBy] - b[sortBy];
        }
        return b[sortBy] - a[sortBy];
      });
    }

    App.showStars();
    App.markBought();
  },

  myBalance: function () {
    web3.eth.getBalance(web3.eth.accounts[0], function (err, result) {
      if (err) {
        console.log(err);
      } else {
        const balance = web3.fromWei(result.toString(), "ether");

        document.getElementById("balance").innerHTML = balance;
      }
    });
  },

  bindEvents: function () {
    $(document).on("click", ".btn-buy", App.handleBuy);
    $(document).on("click", ".btn-search", App.search);
    $(document).on("change", ".form-select", App.search);
  },

  markBought: function () {
    var starInstance;

    App.contracts.PickStar.deployed()
      .then(function (instance) {
        starInstance = instance;

        return starInstance.getStars.call();
      })
      .then(function (stars) {
        for (i = 0; i < stars.length; i++) {
          if (stars[i] !== "0x0000000000000000000000000000000000000000") {
            for (j = 0; j < stars_display.length; j++) {
              if (stars_display[j].id === i) {
                $(".panel-star")
                  .eq(j)
                  .find("button")
                  .text("ถูกสอยแล้ว")
                  .attr("disabled", true);
              }
            }
          }
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  handleBuy: function (event) {
    event.preventDefault();

    var starId = $(event.target).data("id");
    var starPrice = $(event.target).data("price");
    var wei_value = web3.toWei(starPrice, "ether");

    var starInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.PickStar.deployed()
        .then(function (instance) {
          starInstance = instance;

          return starInstance.buyStar(starId, wei_value, {
            from: account,
            value: wei_value,
          });
        })
        .then(function (result) {
          App.myBalance();
          return App.markBought();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
