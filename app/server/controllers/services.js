var requirejs = require('requirejs');
var Backbone = require('backbone');
var sanitizer = require('sanitizer');

var View = require('../views/services');
var ErrorView = require('../views/error');

var DashboardCollection = requirejs('common/collections/dashboards');
var PageConfig = requirejs('page_config');

var get_dashboard_and_render = require('../mixins/get_dashboard_and_render');

var serviceAxes = {
  axes: {
    x: {
      key: 'title',
      label: 'Transaction name'
    },
    y: [
      {
        label: 'Department name',
        key: 'departmentTitle'
      },
      {
        key: 'total-cost',
        label: 'Total cost',
        format: 'currency'
      },
      {
        key: 'transactions-per-year',
        label: 'Transactions per year',
        format: 'integer'
      },
      {
        label: 'Cost per transaction',
        key: 'cost-per-transaction',
        format: 'currency'
      }
    ]
  }
};

var renderContent = function (req, res, client_instance) {
  var services = new DashboardCollection(client_instance.get('items')).filterDashboards(DashboardCollection.SERVICES),
    collection;

  // temp
  var transactions = require('../../support/stagecraft_stub/responses/transaction-data');
  client_instance.set('transactions', JSON.parse(JSON.stringify(transactions)));

  services = formatCollectionData(services);
  services = addServiceDataToCollection(services, client_instance.get('transactions'));
  collection = new DashboardCollection(services, serviceAxes);

  var departments = collection.getDepartments();
  var agencies = collection.getAgencies();

  var model = new Backbone.Model(_.extend(PageConfig.commonConfig(req), {
    title: 'Services',
    'page-type': 'services',
    filter: sanitizer.escape(req.query.filter || ''),
    departmentFilter: req.query.department || null,
    departments: departments,
    agencyFilter: req.query.agency || null,
    agencies: agencies,
    data: services,
    script: true,
    noun: 'service',
    axesOptions: serviceAxes
  }));

  //TODO - why could this not be set on the model options above?
  model.set('sort-by', 'transactions-per-year');

  var client_instance_status = client_instance.get('status');
  var view;
  if (client_instance_status === 200) {
    view = new View({
      model: model,
      collection: collection
    });
  } else {
    view = new ErrorView({
      model: model,
      collection: collection
    });
  }
  view.render();

  res.set('Cache-Control', 'public, max-age=7200');
  res.send(view.html);
};

function formatCollectionData(services) {
  var kpis = {
    'total-cost': null,
    'transactions-per-year': null,
    'cost-per-transaction': null,
    'tx-digital-takeup': null,
    'digital-takeup': null,
    'completion-rate': null,
    'user-satisfaction-score': null
  };
  _.each(services, function(service) {
    _.extend(service, kpis);
    service.departmentTitle = (service.department && service.department.title) || '';
  });
  return services;
}

function addServiceDataToCollection (services, serviceData) {
  var dashboard;

  _.each(serviceData, function (item) {
    var slug = item['dashboard-slug'];

    // only bother looking for the dashboard if we don't already have it
    if (!dashboard || (dashboard.slug !== slug)) {
      dashboard = _.findWhere(services, {
        slug: slug
      });
    }
    if (dashboard) {
      delete item._id;
      delete item._timestamp;
      delete item['dashboard-slug'];
      _.extend(dashboard, item);
    }

  });
  return services;
}

module.exports = function (req, res) {
  var client_instance = get_dashboard_and_render(req, res, renderContent);
  client_instance.setPath('');
};
