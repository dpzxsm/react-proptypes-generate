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
  let { school: schoolAlias = "schoolName", info = { name: "test" }, age = 33, students = [] } = props;
  if(info.year === 2020){
    console.log("will generate year type as number");
  }
  // support deep find
  let childInfo = info.child.info;
  return <div onClick={() => props.onClick()}>
    {students.map((student, index) =><div key={index}/>)}
  </div>
}


// const Test = () => <div title ={props.title}/>;






