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
    growTime: 150,
    exp: 0,
    price: 3
  },
  {
    name: "banana",
    id: 2,
    growTime: 160,
    exp: 0,
    price: 1
  },
  {
    name: "pineapple",
    id: 3,
    growTime: 140,
    exp: 5,
    price: 2
  }
]

class App extends Component {
  state = {
    owner: null,
    balance: 0,
    web3: null,
    accounts: null,
    contract: null,
    slots: null,
    createFarmButtonDisabled: false,
    selectedItem: null
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
      results.push(tmp1);
    }

    tmp = await contract.methods.OwnerMoneyCount(accounts[0]).call({from: accounts[0]});
    var ownerBalance = parseInt(tmp);

    console.log(results)

    this.setState({ slots: results, owner: contractOwner, balance: ownerBalance });
  };

  onRowCallback = (record) => {
    return {
      onClick: event => {
        this.setState({ selectedItem: record });
      },
    };
  }

  createFarmButton = () => {
    if (this.state.slots != null && this.state.slots.length == 0) {
      return <Button disabled={this.state.createFarmButtonDisabled} onClick={(event) => {
        const { accounts, contract } = this.state;
        this.setState({createFarmButtonDisabled: true});
        contract.methods.createFarm().send({ from: accounts[0] });
        setTimeout(this.getFactory, 5000);
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
        setTimeout(async () => {
          for (var ii in cropList) {
            var entry_in = cropList[ii];
            var tmp = await contract.methods.cropsList(entry_in.id).call({from: accounts[0]});
            console.log(tmp);
          }
        }, 5000);
      }}>Update Crop List</Button>
    }
  }

  createSlotManagementButtons = () => {
    const { accounts, contract, balance } = this.state;
    var selected = this.state.selectedItem;
    if (selected != null) {
      const slotID = selected.key;
      if (selected.cropID == "0") {
        var arr = []
        for (var i in cropList) {
          const crop = cropList[i];
          if (selected.exp >= parseInt(crop.exp) && balance > crop.price) {
            arr.push(<Button key={i} onClick={(event) => {
              contract.methods.plant(crop.id, slotID).send({from: accounts[0]});
              setTimeout(this.getFactory, 5000);
            }}>Plant {crop.name}</Button>);
          }
        }
        return arr;
      }
      else if (selected.harvestable) {
        return <Button onClick={(event) => {
          contract.methods.harvest(slotID).send({from: accounts[0]});
          setTimeout(this.getFactory, 5000);
        }}>Harvest</Button>
      }
      else { 
        return <div><Button onClick={(event) => {

        }}>Water</Button><Button onClick={(event) => {

        }}>Weed</Button></div>
      }
    }
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
        entry.count_down = 0;
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
                selectedRowKeys: this.state.selectedItem == null ? [] : [this.state.selectedItem.key]
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
