export class Test extends Component {
  render() {
    let { school: schoolAlias = "schoolName", info = { name: "test" }, age = 33, students = [] } = this.props;
    if(info.year === 2020){
      console.log("will generate year type as number");
    }
    // support deep find
    let childInfo = info.child.info;
    // support null js null propagation
    return <div onClick={() => this.props?.onClick()}>
      {students.map((student, index) =><div key={index}>{item.name}</div>)}
    </div>
  }
}

export default function Test2(props){
  let { school: schoolAlias = "schoolName", info = { name: "test" }, age = 33, students = [] } = props;
  if(info.year === 2020){
    console.log("will generate year type as number");
  }
  // support deep find
  let childInfo = info.child.info;
  // support null js null propagation
  return <div onClick={() => props?.onClick()}>
    {students.map((student, index) =><div key={index}>{item.name}</div>)}
  </div>
}

