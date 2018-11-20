const flow = require('flow-parser');

function flowAst(code) {
  try {
    return flow.parse(code, {
      esproposal_decorators: true,
      esproposal_class_instance_fields: true,
      esproposal_class_static_fields: true,
      esproposal_export_star_as: true,
      esproposal_optional_chaining: true,
      esproposal_nullish_coalescing: true,
      types: true
    })
  } catch (error) {
    console.log('suming-log', error);
  }
}

exports.flowAst = flowAst;