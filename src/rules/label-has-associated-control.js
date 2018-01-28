/**
 * @fileoverview Enforce label tags have an associated control.
 * @author Jesse Beach
 *
 * @flow
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue, elementType } from 'jsx-ast-utils';
import type { JSXElement } from 'ast-types-flow';
import { generateObjSchema, arraySchema } from '../util/schemas';
import type { ESLintContext } from '../../flow/eslint';
import mayContainChildComponent from '../util/mayContainChildComponent';
import mayHaveAccessibleLabel from '../util/mayHaveAccessibleLabel';

const errorMessage =
  'A form label must be associated with a control.';

const schema = generateObjSchema({
  labelComponents: arraySchema,
  labelAttributes: arraySchema,
  controlComponents: arraySchema,
  depth: {
    description: 'JSX tree depth limit to check for accessible label',
    type: 'integer',
    minimum: 0,
  },
});

const validateId = (node) => {
  const htmlForAttr = getProp(node.attributes, 'htmlFor');
  const htmlForValue = getPropValue(htmlForAttr);

  return htmlForAttr !== false && !!htmlForValue;
};

module.exports = {
  meta: {
    docs: {},
    schema: [schema],
  },

  create: (context: ESLintContext) => {
    const options = context.options[0] || {};
    const labelComponents = options.labelComponents || [];
    const componentNames = ['label'].concat(labelComponents);

    const rule = (node: JSXElement) => {
      if (componentNames.indexOf(elementType(node.openingElement)) === -1) {
        return;
      }
      const controlComponents =
        ['input', 'textarea'].concat((options.controlComponents || []));
      // Prevent crazy recursion.
      const recursionDepth = Math.min(
        options.depth === undefined ? 2 : options.depth,
        25,
      );
      const hasLabelId = validateId(node.openingElement);
      const hasNestedControl = controlComponents.some(name => mayContainChildComponent(
        node,
        name,
        recursionDepth,
      ));
      const hasAccessibleLabel = mayHaveAccessibleLabel(
        node,
        recursionDepth,
        options.labelAttributes,
      );

      if (hasLabelId && hasAccessibleLabel) {
        return;
      }
      if (hasNestedControl && hasAccessibleLabel) {
        return;
      }

      // htmlFor case
      context.report({
        node: node.openingElement,
        message: errorMessage,
      });
    };

    // Create visitor selectors.
    return {
      JSXElement: rule,
    };
  },
};
