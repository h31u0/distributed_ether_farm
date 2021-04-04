import React, { Component } from "react";
import SlotMarketContract from "./contracts/SlotMarket.json";
import getWeb3 from "./getWeb3";
import { Modal, Layout, Table, Button, Menu } from 'antd';
import { BuildOutlined, ConsoleSqlOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import Web3 from "web3";

import "./App.css";

const { Header, Content, Footer, Sider } = Layout;

const cropList = [
  {
    name: "apple",
    id: 1,
    growTime: 30,
    exp: 0,
    price: 3
  },
  {
    name: "banana",
    id: 2,
    growTime: 10,
    exp: 0,
    price: 1
  },
  {
    name: "pineapple",
    id: 3,
    growTime: 200,
    exp: 3,
    price: 30
  }
]

const levelList = [0, 10, 25, 50, 100];

const levelUpFee = 1000000000000000;  // 10^15 wei = 0.001 ether

const cols = [
  {title: "crop name", dataIndex: "name"},
  {title: "exp", dataIndex: "exp"},
  {title: "price", dataIndex: "price"},
  {title: "time to harvest", dataIndex: "count_down"}
];

const marketCols = [
  {title: "price", dataIndex: "price"},
  {title: "exp", dataIndex:"exp"},
  {title: "poster", dataIndex:"poster"}
];

class App extends Component {
  state = {
    owner: null,
    balance: 0,
    web3: null,
    accounts: null,
    contract: null,
    slots: null,
    createFarmButtonDisabled: false,
    selectedKey: null,
    friendList: [],
    isModalVisible: false,
    isSellSlotModalVisible: false,
    addFriendsInput: "",
    sellSlotInput: "",
    viewOwner: null,
    friendSlot: null,
    slotsOnMarket: null
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      const slotMarketNetwork = SlotMarketContract.networks[networkId];
      const slotMarketInstance = new web3.eth.Contract(
        SlotMarketContract.abi,
        slotMarketNetwork && slotMarketNetwork.address
      )

      // Event callback functions
      slotMarketInstance.events.updateSlot({
        filter: {}, fromBlock: 0
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
        else if (this.state.slots != null) {
          const { slots, friendSlot} = this.state;
          var updatedSlot = event.returnValues;

          for (var i in slots) {
            var entry = slots[i];
            if (entry.key == parseInt(updatedSlot.slotID)) {
              // dry_time, grass_time, grow_time, price, exp, stealed, cropID
              entry.dry_time = parseInt(updatedSlot.dry_time);
              entry.grass_time = parseInt(updatedSlot.grass_time);
              entry.grow_time = parseInt(updatedSlot.grow_time);
              entry.price = parseInt(updatedSlot.price);
              entry.exp = parseInt(updatedSlot.exp);
              entry.stealed = updatedSlot.stealed;
              entry.cropID = parseInt(updatedSlot.cropID);
              this.state.balance = parseInt(event.returnValues.balance);
            }
          }
 
          for (var i in friendSlot) {
            var entry = friendSlot[i];
            if (entry.key == parseInt(updatedSlot.slotID)) {
              // dry_time, grass_time, grow_time, price, exp, stealed, cropID
              entry.dry_time = parseInt(updatedSlot.dry_time);
              entry.grass_time = parseInt(updatedSlot.grass_time);
              entry.grow_time = parseInt(updatedSlot.grow_time);
              entry.price = parseInt(updatedSlot.price);
              entry.exp = parseInt(updatedSlot.exp);
              entry.stealed = updatedSlot.stealed;
              entry.cropID = parseInt(updatedSlot.cropID);
              this.state.balance = parseInt(event.returnValues.balance);
            }
          }

          this.localStateUpdate();
          this.updateFriendSlotState();
        }
      });

      slotMarketInstance.events.createSlotEvent({
        filter: {}, fromBlock: 0
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
        else {
          // if (event.returnValues.addr == this.state.accounts[0]) {
          //   this.getFactory();
          // }
          this.getFactory();
          this.getMarket();
        }
      });

      slotMarketInstance.events.updateCropList({
        filter: {}, fromBlock: 0
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
        else {
          console.log(event.returnValues);
        }
      })

      slotMarketInstance.events.TradeStatusChange({
        filter: {}, fromBlock: 0
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
        else {
          this.getMarket();
          this.getFactory()
        }
      })

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: slotMarketInstance}, this.getFactory);
      
      setInterval(this.localStateUpdate, 1000);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getMarket = async() => {
    const { accounts, contract} = this.state;
    var results = [];
    console.log("Starttttttt")
    
    // var count = await contract.methods.tradeCounter().call({from: accounts[0]});
    // var num = parseInt(count);
    for (var i = 0; i <= 100; i++) {
      var temp = await contract.methods.trades(i).call({from: accounts[0]});
      if (temp == null) {
        break;
      }
      var poster = temp[0];
      var item = parseInt(temp[1]);
      var price = parseInt(temp[2]);
      var status = temp[3];
 
      temp.tradeIdx = i;
      temp.key = item
      var slt = await contract.methods.slots(item).call({from: accounts[0]});
      if (status) {
        temp.exp = slt.exp;
        temp.price = price;
        temp.item = item;
        temp.poster = poster;
        results.push(temp);
      }

    }
    this.setState({slotsOnMarket: results});
  }

  createMarketContent = () => {
    const { slotsOnMarket } = this.state;
    return (
      <div className="site-layout-content">
        {/* <p>Balance: {this.state.balance}</p>
        {this.createOwnerUtilsButton()} */}
        <Table onRow={this.onRowCallback} 
          dataSource={slotsOnMarket} 
          columns={marketCols} 
          pagination={false} 
          showHeader={true} 
          style={{cursor:"pointer"}} 
          bordered={true}
          rowSelection={{
            type: "radio",
            selectedRowKeys: this.state.selectedKey == null ? [] : [this.state.selectedKey]
          }}
        />
        {/* {this.createSlotManagementButtons()} */}
      </div>
    );
  }

  createMarketButton = () => {
    const { slotsOnMarket, viewOwner, accounts, contract, selectedKey} = this.state;
    var arr = [];
    var selectedItem = null;
    if (viewOwner != 111) {
      return;
    }

    if (slotsOnMarket != null) {
      for (var i in slotsOnMarket) {
        var entry = slotsOnMarket[i];
        if (entry.key == selectedKey) {
          selectedItem = entry;
          break;
        }
      }
    }

    // arr.push(<Button onClick={() => {
    //   this.getMarket();
    // }}>Update Market</Button>);

    if (selectedItem != null && accounts[0] == selectedItem.poster) {
      arr.push(<Button onClick={() => {
        console.log(selectedItem.tradeIdx);
        contract.methods.cancelTrade(selectedItem.tradeIdx).send({from: accounts[0]});
      }}>Cancel Slot</Button>);
    }
    if (selectedItem != null && accounts[0] != selectedItem.poster) {
      arr.push(<Button onClick={() => {
        contract.methods.executeTrade(selectedItem.tradeIdx).send({from: accounts[0], value: selectedItem.price});
      }}>Buy Slot</Button>);
    }
    return arr;
  }
 
  getFactory = async () => {
    const { accounts, contract } = this.state;

    var contractOwner = await contract.methods.owner().call({from: accounts[0]});
    var tmp = await contract.methods.getFarmByOwner(accounts[0]).call({from: accounts[0]});
    var results = []

    for (var i in tmp) {
      var tmpInt = parseInt(tmp[i]);
      var tmp1 = await contract.methods.slots(tmpInt).call({from: accounts[0]});
      tmp1.key = tmpInt;

      if (tmp1.cropID == "0") {
        tmp1.dry_time = 0;
        tmp1.grass_time = 0;
        tmp1.grow_time = 0;
        tmp1.price = 0;
      }

      results.push(tmp1);
    }

    tmp = await contract.methods.OwnerMoneyCount(accounts[0]).call({from: accounts[0]});
    var ownerBalance = parseInt(tmp);

    this.setState({ slots: results, owner: contractOwner, balance: ownerBalance, viewOwner: accounts[0]});
    this.localStateUpdate();
  };



  onRowCallback = (record) => {
    return {
      onClick: event => {
        this.setState({ selectedKey: record.key });
      },
    };
  }

  createFarmButton = () => {
    const { slots, viewOwner, accounts, contract } = this.state;
    if (slots != null && slots.length == 0 && viewOwner == accounts[0]) {
      return <Button disabled={this.state.createFarmButtonDisabled} onClick={(event) => {
        this.setState({createFarmButtonDisabled: true});
        contract.methods.createFarm().send({ from: accounts[0] });
      }}>Create Farm</Button>
    }
  }

  createOwnerUtilsButton = () => {
    const { accounts, contract } = this.state;
    var arr = [];
    if (this.state.owner == this.state.accounts[0]) {
      arr.push(<Button key={0} onClick={(event) => {
        for (var i in cropList) {
          var entry = cropList[i];
          contract.methods.modInCropsList(entry.id, entry.growTime, entry.price, entry.exp).send({from: accounts[0]});
        }
      }}>Update Crop List</Button>);

      arr.push(<Button key={1} onClick={(event) => {
        for (var i in levelList) {
          var entry = levelList[i];
          contract.methods.addInLevelList(entry).send({from: accounts[0]});
        }
      }}>Update Level List</Button>);
    }

    return arr;
  }

  createSlotManagementButtons = () => {
    const { accounts, contract, balance, selectedKey, slots } = this.state;
    var arr = [];
    var selectedItem = null;

    if (slots != null) {
      for (var i in slots) {
        var entry = slots[i];
        if (entry.key == selectedKey) {
          selectedItem = entry;
          break;
        }
      }
    }

    // Buy new slot button
    if (slots != null && slots.length != 0) {
      arr.push(<Button key={1000} onClick={(event) => {
        contract.methods.buySlot(1).send({from: accounts[0], value: levelUpFee});
      }}>Purchase Slot</Button>)
    }

    if (selectedItem != null) {
      // Upgrade slot button
      arr.push(<Button key={999} onClick={(event) => {
        // value is in wei, not ether
        contract.methods.UpgradeSlot(selectedItem.key).send({from: accounts[0], value: levelUpFee});  // TODO: setLevelUpFee
      }}>Upgrade Slot</Button>)
    }

    if (selectedItem != null) {
      const slotID = selectedItem.key;
      if (selectedItem.cropID == "0") {
        // Slot is empty
        // Create sell slot button
        if (slots.length > 6) {
          arr.push(<Button key={998} onClick={(event) => {
            this.setState({ isSellSlotModalVisible: true });
          }}>Sell on Market</Button>);
          arr.push(<Modal title="Sell Slot" visible={this.state.isSellSlotModalVisible} onOk={() => {
            try {
              contract.methods.openTrade(slotID, this.state.sellSlotInput).send({ from:accounts[0] });
            }
            catch (err) {
              // TODO: Show invalid number message
              console.log(err);
            }
            this.setState({ isSellSlotModalVisible: false });
          }} onCancel={() => {
            this.setState({ isSellSlotModalVisible: false });
          }}>
            slot price (in Wei): <label htmlFor="Slot to sell"> </label>
            <input
              type="text"
              name="Slot to sell"
              value={this.state.sellSlotInput}
              onChange={(event) => {
                this.setState({sellSlotInput: event.target.value});
              }}
            /></Modal>)
        }

        // Create plant buttons
        for (var i in cropList) {
          const crop = cropList[i];
          if (parseInt(selectedItem.exp) >= parseInt(crop.exp) && balance > crop.price) {
            arr.push(<Button key={i} onClick={(event) => {
              contract.methods.plant(crop.id, slotID).send({from: accounts[0]});
            }}>Plant {crop.name}</Button>);
          }
        }
      }
      else if (selectedItem.harvestable) {
        arr.push(<Button onClick={(event) => {
          contract.methods.harvest(slotID).send({from: accounts[0]});
        }}>Harvest</Button>)
      }
      else {
        if (selectedItem.dry) {
          arr.push(<Button key={0} onClick={(event) => {
            contract.methods.watering(slotID).send({from: accounts[0]});
          }}>Water</Button>);
        }
        if (selectedItem.grass) {
          arr.push(<Button key={1} onClick={(event) => {
            contract.methods.weeding(slotID).send({from: accounts[0]});
          }}>Weed</Button>);
        }
      }
    }
    return arr;
  }

  localStateUpdate = async () => {
    const { slots, contract, accounts, viewOwner } = this.state;
    if (viewOwner != accounts[0]) {
      return;
    }
    const timeStamp = Date.parse(new Date()) / 1000;
    if (slots == null) return;

    for (var i in slots) {
      var entry = slots[i];
      entry.dry = false;
      entry.grass = false;
      entry.harvestable = false;
      entry.status = []
      // grow_time, grass_time, dry_time
      if (entry.grow_time == 0) {
        entry.count_down = "NA"
      }
      else if (timeStamp >= entry.grow_time) {
        entry.count_down = "✔";
        entry.harvestable = true;
      }
      else {
        entry.count_down = entry.grow_time - timeStamp;
      }

      if (entry.grow_time != 0) {
        if (entry.grass_time <= timeStamp) {
          entry.grass = true;
          entry.status.push("grass")
        }
        if (entry.dry_time <= timeStamp) {
          entry.dry = true;
          entry.status.push("dry")
        }
      }
    }

    var fl = await contract.methods.getFriendsByOwner(accounts[0]).call({from: accounts[0]});

    this.setState({ slots: slots, friendList: fl });
  }

  createFriendsMenu = () => {
    const { friendList, contract, accounts, addFriendsInput } = this.state;

    var menuItems = [];
    var arr = [];

    menuItems.push({name: "Market", key: 111})
    menuItems.push({ name: "My Farm", key: accounts[0] });

    for (var i in friendList) {
      var entry = friendList[i];
      menuItems.push({ name: entry, key: entry })
    }

    for (var i in menuItems) {
      var entry = menuItems[i];
      arr.push(<Menu.Item key={entry.key}>{entry.name}</Menu.Item>);
    }

    arr.push(<Button onClick={() => {this.setState({ isModalVisible: true })}}>+ Add Friend</Button>)
    arr.push(
    <Modal title="Add Friend" visible={this.state.isModalVisible} onOk={async () => {
      console.log(this.state.addFriendsInput);
      var tmp = false;
      try {
        tmp = await contract.methods.addFriend(accounts[0], addFriendsInput).send({from: accounts[0]});
      }
      catch {
        // TODO: Show invalid address message
      }
      console.log(tmp);
      this.setState({ isModalVisible: false });
    }} onCancel={() => {
      this.setState({ isModalVisible: false });
    }}>
      <form>
        Friend Address: <label htmlFor="Friend to add"> </label>
        <input
          type="text"
          name="Friend to add"
          value={this.state.addFriendsInput}
          onChange={(event) => {
            this.setState({addFriendsInput: event.target.value});
          }}
        />
      </form>
    </Modal>)

    return arr;
  }

  handleFriendMenuClick = (event) => {
    if (event.key) this.setState({viewOwner: event.key});
  }

  updateFriendSlot = async () => {
    const { accounts, contract, viewOwner } = this.state;
    var tmp = await contract.methods.getFarmByOwner(viewOwner).call({from: accounts[0]});
    var results = []

    for (var i in tmp) {
      var tmpInt = parseInt(tmp[i]);
      var tmp1 = await contract.methods.slots(tmpInt).call({from: accounts[0]});
      tmp1.key = tmpInt;

      if (tmp1.cropID == "0") {
        tmp1.dry_time = 0;
        tmp1.grass_time = 0;
        tmp1.grow_time = 0;
        tmp1.price = 0;
      }

      results.push(tmp1);
    }

    this.setState({friendSlot: results});
  };

  updateFriendSlotState = async () => {
    const { friendSlot, contract, accounts } = this.state;
    const timeStamp = Date.parse(new Date()) / 1000;
    if (friendSlot == null) return;

    for (var i in friendSlot) {
      var entry = friendSlot[i];
      entry.dry = false;
      entry.grass = false;
      entry.harvestable = false;
      entry.status = []
      // grow_time, grass_time, dry_time
      if (entry.grow_time == 0) {
        entry.count_down = "NA"
      }
      else if (timeStamp >= entry.grow_time) {
        entry.count_down = "✔";
        entry.harvestable = true;
      }
      else {
        entry.count_down = entry.grow_time - timeStamp;
      }

      if (entry.grow_time != 0) {
        if (entry.grass_time <= timeStamp) {
          entry.grass = true;
          entry.status.push("grass")
        }
        if (entry.dry_time <= timeStamp) {
          entry.dry = true;
          entry.status.push("dry")
        }
      }
    }
  }

  createDeleteStealButton = () => {
    const { slots, friendSlot, viewOwner, accounts, contract, selectedKey} = this.state;
    var arr = [];
    var selectedItem = null;
    if (accounts[0] == viewOwner) {
      return;
    }
    if (friendSlot != null) {
      for (var i in friendSlot) {
        var entry = friendSlot[i];
        if (entry.key == selectedKey) {
          selectedItem = entry;
          break;
        }
      }
    }

    if (selectedItem != null && selectedItem.harvestable && !selectedItem.stealed) {
      arr.push(
        <Button onClick={(event) => {
          contract.methods.steal(selectedItem.key).send({from: accounts[0]});
          this.updateFriendSlot();
          this.updateFriendSlotState();
        }}>Steal</Button>
      )
    }

    arr.push(<Button onClick={() => {
      contract.methods.deleteFriend(accounts[0], viewOwner).send({from: accounts[0]});
      this.setState({viewOwner: accounts[0]});
    }}>Delete Friend</Button>);
    return arr;
  }

  createFarmContent = () => {
    const { slots, friendSlot, viewOwner, accounts, contract } = this.state;
    if (accounts[0] == viewOwner) {
      return (
        <div className="site-layout-content">
          <p>Balance: {this.state.balance}</p>
          {this.createOwnerUtilsButton()}
          <Table onRow={this.onRowCallback} 
            dataSource={slots} 
            columns={cols} 
            pagination={false} 
            showHeader={true} 
            style={{cursor:"pointer"}} 
            bordered={true}
            rowSelection={{
              type: "radio",
              selectedRowKeys: this.state.selectedKey == null ? [] : [this.state.selectedKey]
            }}
          />
          {this.createSlotManagementButtons()}
        </div>
      );
    }
    else {
      if (viewOwner != null && viewOwner != 111) {
        this.updateFriendSlot();
        this.updateFriendSlotState();
      }
      // TODO: Render friend's farm
      return (
        <div className="site-layout-content">
        <p>Balance: {this.state.balance}</p>
        {this.createOwnerUtilsButton()}
        <Table onRow={this.onRowCallback} 
          dataSource={friendSlot} 
          columns={cols} 
          pagination={false} 
          showHeader={true} 
          style={{cursor:"pointer"}} 
          bordered={true}
          rowSelection={{
            type: "radio",
            selectedRowKeys: this.state.selectedKey == null ? [] : [this.state.selectedKey]
          }}
        />
        {this.createDeleteStealButton()}
      </div>
      );
    }
  }

  render() {
    if (this.state.viewOwner == 111) {
      return (
        <Layout className="layout" style={{ minWidth:"500px" }}>
          <Header style={{ color:"white", whiteSpace:"nowrap" }}>
            <BuildOutlined style={{ color:"white", fontSize:"200%", paddingInline: '0 25px'  }} />
            Account ID: {this.state.accounts[0]}
          </Header>
          <Layout>
            <Sider>
              <Menu theme="dark" mode="inline" defaultSelectedKeys={[this.state.accounts[0]]} onClick={this.handleFriendMenuClick}>
                {this.createFriendsMenu()}
              </Menu>
            </Sider>
            <Layout>
              <Content style={{ padding: '0 50px' }}>
                {this.createMarketContent()}
                {this.createMarketButton()}
              </Content>
              <Footer style={{ textAlign: 'center' }}>CSC2125 DApp</Footer>
            </Layout>
          </Layout>
        </Layout>
      );
    }
    if (this.state.accounts == this.state.viewOwner) {
      var itemList = this.state.slots;
    } else {
      var itemList = this.state.friendSlot;
    }


    if (itemList != null) {
      for (var i in itemList) {
        var entry = itemList[i];
        if (entry.cropID == "0") {
          entry.name = "empty";
        }
        else {
          entry.name = cropList[parseInt(entry.cropID) - 1].name;
          if (this.state.accounts == this.state.viewOwner) {
            if (entry.dry || entry.grass) {
              entry.name = entry.name + " (" + entry.status.toString() + ")";
            }
          } else {
            if (entry.stealed) {
              entry.name = entry.name + " (stolen)";
            }
          }
        }
      }
    }

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Layout className="layout" style={{ minWidth:"500px" }}>
        <Header style={{ color:"white", whiteSpace:"nowrap" }}>
          <BuildOutlined style={{ color:"white", fontSize:"200%", paddingInline: '0 25px'  }} />
          Account ID: {this.state.accounts[0]}
        </Header>
        <Layout>
          <Sider>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={[this.state.accounts[0]]} onClick={this.handleFriendMenuClick}>
              {this.createFriendsMenu()}
            </Menu>
          </Sider>
          <Layout>
            <Content style={{ padding: '0 50px' }}>
              {this.createFarmContent()}
              {this.createFarmButton()}
            </Content>
            <Footer style={{ textAlign: 'center' }}>CSC2125 DApp</Footer>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default App;
