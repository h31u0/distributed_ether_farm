import React, { Component } from "react";
import SlotManagementContract from "./contracts/SlotManagement.json";
import getWeb3 from "./getWeb3";
import { Layout, Table, Button } from 'antd';
import { BuildOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import "./App.css";

const { Header, Content, Footer } = Layout;

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

const levelUpFee = 1000000000000000;  // 10^15 wei = 0.001 ether

class App extends Component {
  state = {
    owner: null,
    balance: 0,
    web3: null,
    accounts: null,
    contract: null,
    slots: null,
    createFarmButtonDisabled: false,
    selectedKey: null
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      const slotManagementNetwork = SlotManagementContract.networks[networkId];
      const slotManagementInstance = new web3.eth.Contract(
        SlotManagementContract.abi,
        slotManagementNetwork && slotManagementNetwork.address
      )

      // Event callback functions
      slotManagementInstance.events.updateSlot({
        filter: {}, fromBlock: 0
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
        else if (this.state.slots != null) {
          const { slots } = this.state;
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

          this.localStateUpdate();
        }
      });

      slotManagementInstance.events.createSlotEvent({
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
        }
      });

      slotManagementInstance.events.updateCropList({
        filter: {}, fromBlock: 0
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
        else {
          console.log(event.returnValues);
        }
      })

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: slotManagementInstance}, this.getFactory);

      setInterval(this.localStateUpdate, 1000);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

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

    this.setState({ slots: results, owner: contractOwner, balance: ownerBalance });
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
    if (this.state.slots != null && this.state.slots.length == 0) {
      return <Button disabled={this.state.createFarmButtonDisabled} onClick={(event) => {
        const { accounts, contract } = this.state;
        this.setState({createFarmButtonDisabled: true});
        contract.methods.createFarm().send({ from: accounts[0] });
      }}>Create Farm</Button>
    }
  }

  createUpdateCropListButton = () => {
    if (this.state.owner == this.state.accounts[0]) {
      return <Button onClick={(event) => {
        const { accounts, contract } = this.state;
        for (var i in cropList) {
          var entry = cropList[i];
          contract.methods.modInCropsList(entry.id, entry.growTime, entry.price, entry.exp).send({from: accounts[0]});
        }
      }}>Update Crop List</Button>
    }
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

  localStateUpdate = () => {
    const { slots } = this.state;
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

    this.setState({ slots: slots });
  }

  render() {
    var itemList = this.state.slots;

    if (itemList != null) {
      for (var i in itemList) {
        var entry = itemList[i];
        if (entry.cropID == "0") {
          entry.name = "empty";
        }
        else {
          entry.name = cropList[parseInt(entry.cropID) - 1].name;
          if (entry.dry || entry.grass) {
            entry.name = entry.name + " (" + entry.status.toString() + ")";
          }
        }
      }
    }

    var cols = [
      {title: "crop name", dataIndex: "name"},
      {title: "exp", dataIndex: "exp"},
      {title: "price", dataIndex: "price"},
      {title: "time to harvest", dataIndex: "count_down"}
    ];

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Layout className="layout" style={{ minWidth:"500px" }}>
        <Header style={{ color:"white", whiteSpace:"nowrap" }}>
          <BuildOutlined style={{ color:"white", fontSize:"200%", paddingInline: '0 25px'  }} />
          Account ID: {this.state.accounts[0]}
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <div className="site-layout-content">
            <p>Balance: {this.state.balance}</p>
            {this.createUpdateCropListButton()}
            <Table onRow={this.onRowCallback} 
              dataSource={itemList} 
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
          {this.createFarmButton()}
        </Content>
        <Footer style={{ textAlign: 'center' }}>CSC2125 DApp</Footer>
      </Layout>
    );
  }
}

export default App;
