import PropTypes from 'prop-types';
export default class Test extends PureComponent {
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     title: props.title,
  //     age: props.age
  //   };
  // }

  render() {
    let { school: schoolAlias = "schoolName", info = { name: 2 } } = this.props;
    let info = this.props.info;
    let heihei = this.props.info.heihei;
    let age = info.age;
    let name = info.name;
    return <div>
    </div>
  }
}

Test.propTypes = {
  info: PropTypes.shape({
    age: PropTypes.any,
    heihei: PropTypes.any,
    name: PropTypes.number
  }),
  school: PropTypes.string
}


// const PropTypes = require("prop-types");
// export function Test(props) {
//   let name = props.people.name;
//   return (
//     <div className="player">
//     </div>
//   );
// }


// const Test = () => <div title ={props.title}/>;


// Test.propTypes = {
//   clip: PropTypes.number,
//   dd: PropTypes.any
// }







