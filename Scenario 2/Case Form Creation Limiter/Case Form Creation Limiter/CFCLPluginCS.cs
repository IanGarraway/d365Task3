using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Remoting.Contexts;
using System.Runtime.Remoting.Services;
using System.Text;
using System.Threading.Tasks;


namespace Case_Form_Creation_Limiter
{
    public class CaseCreationLimiter : IPlugin {
        /// <summary>
        /// This plugin will stop the creation of new cases where the account already has at least one open case
        /// </summary>
        /// <param name="serviceProvider"></param>
        public void Execute(IServiceProvider serviceProvider)
        {
            // Obtain the organization service from the provider
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));            
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            var service = serviceFactory.CreateOrganizationService(context.UserId);

            try
            {
                Entity targetEntity = VerifyData(context);
                ConfirmNoOtherCases(targetEntity, tracingService, service);

            }
            catch (InvalidPluginExecutionException ex)
            {
                tracingService.Trace("Unable to create the new case: " + ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                tracingService.Trace("An unexpected error has caused creation of this case to terminate");
                tracingService.Trace(ex.ToString());
                throw new InvalidPluginExecutionException("An unexpected error occurred in the plugin. Please contact support.", ex);
            }
        }

        private Entity VerifyData(IPluginExecutionContext context)
        {
            //Verify access to form data
            if (!(context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity targetEntity))
            {
                throw new InvalidPluginExecutionException("Error accessing the form");
            }
            //Ensure customer ID is available
            if (!targetEntity.Contains("customerid"))
            {
                throw new InvalidPluginExecutionException("Customer data not available");
            }

            return targetEntity;
        }

        private void ConfirmNoOtherCases(Entity targetEntity, ITracingService tracingService, IOrganizationService service)
        {
            EntityReference accountReference = (EntityReference)targetEntity["customerid"];
            tracingService.Trace($"Checking for open cases for Account id: {accountReference.Id}"); //Start of Tracing

            EntityCollection openCases = RetrieveOpenCases(service, QueryBuilder(accountReference));

            if (openCases.Entities.Count > 0)
            {
                if (openCases[0].Attributes.Contains("title"))
                {
                    string caseTitle = openCases.Entities[0].Attributes["title"].ToString();
                    throw new InvalidPluginExecutionException($"An open case ('{caseTitle}') already exists for the selected account");
                }
                throw new InvalidPluginExecutionException($"An open case already exists for the selected account");
            }
            tracingService.Trace("New Case creation allowed.");
        }
        

        //This method generates the query for all active cases for the selected account
        private QueryExpression QueryBuilder(EntityReference accountReference)
        {
            QueryExpression query = new QueryExpression("incident")
            {
                ColumnSet = new ColumnSet("incidentid", "title"),
                Criteria =
                {
                    Conditions =
                    {
                        new ConditionExpression("customerid", ConditionOperator.Equal, accountReference.Id),
                        new ConditionExpression("statecode", ConditionOperator.Equal, 0) //state: active
                    }
                },
                TopCount = 1 //Limit to 1 result for performance
            };
            return query;

        }

        //takes the query built by the QueryBuilder method and uses it to retrieve the relevant cases
        private EntityCollection RetrieveOpenCases(IOrganizationService service, QueryExpression query)
        {
            EntityCollection openCases = service.RetrieveMultiple(query);
            return openCases;
        }
    }
}
