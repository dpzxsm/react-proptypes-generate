import PropTypes from 'prop-types';
// export default class Test extends PureComponent {

//   constructor(props) {
//     super(props);
//     this.state = {
//       title: props.title,
//       age: props.age
//     };
//   }

//   render() {
//     let { school: schoolAlias = "schoolName", info = { name: 2 }, jk = 33, students = [] } = this.props;
//     let info = this.props.info;
//     // let legnth = this.props.info.legnth;
//     // let age = info.age;
//     // let name = info.name;
//     return <div>
//     </div>
//   }
// }

export function Test(props) {
  let { school: schoolAlias = 'schoolName', info = { name: 2 }, year = 33, students = [], onClick } = props;
  let length = students.length;
  return <div onClick={() => onClick()}></div>
}

Test.propTypes = {
  info: PropTypes.shape({
    name: PropTypes.number
  }),
  onClick: PropTypes.func,
  school: PropTypes.string,
  students: PropTypes.array,
  year: PropTypes.number
}

// const Test = () => <div title ={props.title}/>;






