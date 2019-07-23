import _ from "lodash";

// typescript decorator which makes sure that this function
// is called only once at a time
// subsequent calls return the promise of the first call
export function synchronized(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let method = descriptor.value;

    descriptor.value = function () {
        if (!this.inflightCalls)
            this.inflightCalls = {};
        if (this.inflightCalls[propertyKey])
            return this.inflightCalls[propertyKey];

        this.inflightCalls[propertyKey] = method.apply(this, arguments);
        return this.inflightCalls[propertyKey].then((result: any) => {
            this.inflightCalls[propertyKey] = null;
            return result;
        });
    }
}

export function isBlank(str: string) {
    return !str || str.trim().length === 0;
}

export function getDashboardVariables(variableSrv: any): any {
    const variables = {};
    if (!variableSrv.variables) {
        // variables are not defined on the datasource settings page
        return {};
    }

    variableSrv.variables.forEach((variable) => {
        let variableValue = variable.current.value;
        if (variableValue === '$__all' || _.isEqual(variableValue, ['$__all'])) {
            if (variable.allValue === null) {
                variableValue = variable.options.slice(1).map((textValuePair: any) => textValuePair.value);
            } else {
                variableValue = variable.allValue;
            }
        }

        variables[variable.name] = {
            text: variable.current.text,
            value: variableValue,
        };
    });

    return variables;
}

export function getConnectionParams(variableSrv: any, target: any, instanceSettings: any) {
    if (!isBlank(target.url)) {
        return [target.url, target.container];
    }

    const dashboardVariables = getDashboardVariables(variableSrv);
    if (!isBlank(dashboardVariables.url)) {
        return [dashboardVariables.url, dashboardVariables.container];
    }

    if (!isBlank(instanceSettings.url)) {
        return [instanceSettings.url, instanceSettings.jsonData.container];
    }

    throw { message: "Cannot find any connection parameters." };
}