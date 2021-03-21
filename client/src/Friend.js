import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import { Menu, Button } from 'antd';
import 'antd/dist/antd.css';
import Web3 from "web3";
import "./App.css";


class Friend extends Component {
  state = {
    owner: null,
    balance: 0,
    web3: null,
    accounts: null,
    contract: null,
    slots: null,
    addFriendsInput: null,
    deleteFriendsInput: null,
    showFriendList: false,
    FriendsList: []
  };

  // componentWillMount() {
  //   this.loadBlockchainData()
  // }

  // async loadBlockchainData() {
  //   const web3 = await getWeb3();
  //   const accounts = await web3.eth.getAccounts();
  //   const networkId = await web3.eth.net.getId();
  //   const FriendNetwork = FriendContract.networks[networkId];
  //   const FriendInstance = new web3.eth.Contract(
  //     FriendContract.abi,
  //     FriendNetwork && FriendNetwork.address
  //   );
  //   this.setState({ accounts: accounts[0] });
  //   this.setState({contract: FriendInstance});
  // }

  constructor(props) {
    super(props)
    this._onButtonClick = this._onButtonClick.bind(this);
  }

  _onButtonClick() {
    this.setState({
      showComponent: true,
    });
    this.updateFriendsList();
  }

  displayList() {
    const {FriendsList} = this.state;
    const listItems = FriendsList.map((f) => <li>{f}</li>);
    return listItems;
  }
 
  handleAddChange = event => {
    this.setState({ addFriendsInput: event.target.value });
  };

  handleDeleteChange = event => {
    this.setState({ deleteFriendsInput: event.target.value });
  };

  addFriendButton = () => {
    return <Button onClick={(event) => {
      const web3 = getWeb3()
      const {addFriendsInput} = this.state;
      if (Web3.utils.isAddress(addFriendsInput)) {
        this.props.contract.methods.addFriend(this.props.accounts, addFriendsInput).send({from: this.props.accounts});
      }
      this.updateFriendsList();
    }}>Add Friend</Button>
  }

  deleteFriendButton = () => {
    return <Button onClick={(event) => {
      const web3 = getWeb3();
      const {deleteFriendsInput} = this.state;
      if (Web3.utils.isAddress(deleteFriendsInput)) {
        this.props.contract.methods.deleteFriend(this.props.accounts, deleteFriendsInput).send({from: this.props.accounts});
      } else {
        console.log("Invalid input")
      }
      this.updateFriendsList();
    }}>Delete Friend</Button>
  }

  async updateFriendsList(){
    const { addFriendsInput} = this.state;
    var tmp = await this.props.contract.methods.getFriendsByOwner(this.props.accounts).call({from: this.props.accounts});
    var results = [];
    for (var i in tmp) {
      results.push(tmp[i]);
    }
    this.setState({FriendsList: results});
  }

  createFriendsMenu = () => {
    var menuItems = [];
    var arr = [];

    menuItems.push("My Farm");
    for (var i in menuItems) {
      arr.push(<Menu.Item key={i}>{menuItems[i]}</Menu.Item>)
    }

    return arr;
  }
    
  render() {
    return (
      <Menu theme="dark" mode="inline" defaultSelectedKeys={['0']}>
        {this.createFriendsMenu()}
      </Menu>
    );
    // return (
    //   <React.Fragment>
    //     <form>
    //       <label htmlFor="Friend to add"> </label>
    //       <input
    //         type="text"
    //         name="Friend to add"
    //         value={this.state.addFriendsInput}
    //         onChange={this.handleAddChange}
    //       />
    //     </form>
    //     {this.addFriendButton()}
    //     <form>
    //       <label htmlFor="Friend to delete"> </label>
    //       <input
    //         type="text"
    //         name="Friend to delete"
    //         value={this.state.deleteFriendsInput}
    //         onChange={this.handleDeleteChange}
    //       />
    //     </form>
    //     {this.deleteFriendButton()}


    //     {/* <div className="container">
    //     <p>Your account: {this.state.accounts}</p>

    //     </div> */}
    //     {/* <h3>Friends to Add: {this.state.addFriendsInput}</h3>
    //     <h3>Friends to Delete: {this.state.deleteFriendsInput}</h3> */}
    //     <div>

    //     <h3> Friend List: </h3>

    //           <div>
    //     <Button onClick={this._onButtonClick}>Show Friend List</Button>
    //     {       <ul>{this.displayList()}</ul>
    //     }
    //   </div>

    //   </div>
    //   </React.Fragment>
    // );
  }
}

export default Friend;