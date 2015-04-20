var InstagramFeed = function (ele) {
  this.ele = ele;
  this.$ele = $(this.ele);
  this.api_url = 'https://api.instagram.com/v1';
  
  this.request_queue = [];
  this.requesting = false;
  
  this.image_count_default = 12;
  this.image_count_buffer = 10; // add a few extra incase we some have been filtered out by instagram or the blacklist
  
  this._get_data();
  this._load_feed();
};

InstagramFeed.prototype._get_data = function () {
  this.client_id = this.$ele.data('client-id');
  this.image_count = ( this.$ele.data('image-count') || this.image_count_default ) + this.image_count_buffer;
  
  this.hashtag = this.$ele.data('hashtag');
  this.user = this.$ele.data('user');
  this._get_user_id();
};

InstagramFeed.prototype._get_user_id = function () {
  if (this.user) {
    this.request_queue.push('user_id');
    this._start_requests();
  }
};

InstagramFeed.prototype._load_feed = function () {
  var request_type;
  if (this.hashtag !== undefined) {
    request_type = 'hashtag';
  } else if (this.user !== undefined) {
    request_type = 'user';
  }
  this.request_queue.push(request_type);
  this._start_requests();
};

InstagramFeed.prototype._build_request = function (type) {
  if (this.client_id === null) throw '[ERROR] Instagram: You must provide a client id';
  var request = {};
  request.data = {
    client_id: this.client_id
  };
  
  switch (type) {
    case 'user_id':
      request.url = this.api_url + '/users/search?q=' + this.user;
      request.callback = function (response) {
        this.user_id = response.data[0].id;
      };
      break;
    
    case 'user':
      request.url = this.api_url + '/users/' + this.user_id + '/media/recent';
      request.data = $.extend(request.data, {
        count: this.image_count
      });
      request.callback = function (response) {
        this._build_feed(response.data);
      };
      break;
    
    case 'hashtag':
      request.url = this.api_url + '/tags/' + this.hashtag + '/media/recent';
      request.data = $.extend(request.data, {
        count: this.image_count
      });
      request.callback = function (response) {
        this._build_feed(response.data);
      };
      break;
  }
  
  return request;
};

InstagramFeed.prototype._start_requests = function () {
  if (!this.requesting) {
    this.requesting = true;
    this._request();
  }
};

InstagramFeed.prototype._request = function () {
  if (this.request_queue.length > 0) {
    var _this = this;
    var request_type = this.request_queue.shift();
    var request = this._build_request(request_type);
    
    $.ajax({
      dataType: "jsonp",
      url: request.url,
      data: request.data
    })
    .done(function (response) {
      request.callback.apply(_this, [response]);
      _this._request();
    })
    .fail(function (a,b,c) {
      console.log('fail', a, b, c);
    });
    
  } else {
    this.requesting = false;
  }
};

InstagramFeed.prototype._build_feed = function (data) {
  console.log('done', data);
};

module.exports = InstagramFeed;