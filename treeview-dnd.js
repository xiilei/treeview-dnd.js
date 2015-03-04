/**
 * treeview-dnd.js CommonJS
 *
 * https://github.com/empty125/treeview-dnd.js
 * @license http://www.apache.org/licenses/LICENSE-2.0
 * @author xilei
 */

(function (global, factory) {
  if (typeof define === "function" && define.cmd) {
    define(function(require, exports, module){
        factory(module.exports = {},require('jquery'));// CommonJS
    });
  }else {
    factory(global.TreeDnd = {},jQuery); // <script>
  }
})(this,function(exports,J) {
    //drag and drop manager
    var Dnd = {
        
        _doc : J(window.document),
        
        _initd:false,
        
        _items:[], 
        
        _lastHit : '',
        
        _lastSelected:'',
        
        _draghoverCls:'',
        
        _copy:'',
        
        _target:'',
        
        _appendType:'',//'insert,after,custom'
        
        _clsHandlers:{
          
        },
        
        _timer:'',
        
        dropDisableCls:'dropdisabled',
        
        _dropCls:[],
        
        _countId:1,
        
        _newHtml:['<li class="edit-element expand" {#attrs}>',
                    '<div class="{#cls} expand-header level{#level}-header">',
                        '<div class="item-label">{#icon}<span class="title">{#title}</span></div>',
                        '<div class="ct-controls">{#controls}</div>',
                        '</div>',
                    '<div class="insert" style=""></div>',//这里为了可能的insert操作预留
                   '<ul style="display:{#expand}">{#children}</ul>',
               '</li>'].join(''),      
        
        _dragoffset :{},
        
        initDrop:function(dropcls){
          var me = this;
          me._dropCls.push(dropcls);
          J(dropcls).each(function(i){
             var _this = J(this);
             me.setArea(_this);
             _this.data('dnd_id',me._countId++);
             me._items.push(_this);
          });
        },
        
        setArea:function(target){
             var offset = target.offset();
             var oh = target.outerHeight();
             target.area = {
                 'top':offset.top,
                 'bottom':offset.top+target.outerHeight(),
                 'left':offset.left,
                 'right':offset.left+target.outerWidth(),
                 'middle':offset.top+oh/2
             }; 
             target.dndparent=target.parent();
             target.dndlevel =target.dndparent.attr('data-level') || 1; 
             return target;
        },
        
        setDisabled:function(target){
            if(!target){
               return false;
            }
            var handle = this._getHandle(target);
            if(!handle){
                return false;
            }
            if(handle['targetCls']){
                target.parent().addClass(handle['targetCls']);
            }
            if(handle['dropabled']){
                target.find(this._dropCls.join(',')).addClass(this.dropDisableCls);
            }
           return target;
        },
        
        setEnabled:function(target){
           if(!target){
               return false;
           }
           var handle = this._getHandle(target);
           if(!handle){
                return false;
           }
           if(handle['targetCls']){
                target.parent().removeClass(handle['targetCls']);
           }
           if(handle['dropabled']){
               target.find(this._dropCls.join(',')).removeClass(this.dropDisableCls);
           }
           return target;
        },
        
        updateArea:function(){
	       var offset = 0,me=this;
           for(;offset<me._items.length;offset++){
               me.setArea(me._items[offset]);
               me._items[offset].data('dnd_id',offset+1);
           }
           me._countId  = me._items.length == 0 ? 1 : me._items.length;
        },
        
        removeItem:function(target){
           var dnd_id = target.data('dnd_id'); 
           
           target.parent().remove(); 
           if(dnd_id){
               this._items.splice(dnd_id-1,1);
               this.updateArea();
           }
        },
        
        addItem:function(cls,target){
            if(!cls || !target){
                return false;
            }            
            target.attr('data-group',cls);
            var handle = this._getHandle(target);
            if(target.length>0 && handle){
                this.setArea(target);
                target.data('dnd_id',this._countId++);                
                this._bindDrag(target,handle);
                this._items.push(target);
                this.bindExEvent(target);
            }
        },
        
        setCurrentItem:function(target,copy){
            this._copy = copy;
            this._target =this.setArea(target);
            this.setDisabled(this._target);
        },
        
        checkCrash:function(a1,a2){
            return a1.middle<=a2.bottom && a1.middle>=a2.top 
                    && !(a1.right<a2.left || a1.left>a2.right);
            
        },
        
        checkDropEnable:function(item){
            if(!item || !item.dndlevel){               
                return false;
            }
            if(this._target.data('dnd_id') == item.data('dnd_id') ||
                  item.hasClass(this.dropDisableCls)){
                return false;
            }
            return true;
        },
        
        checkHit:function(){
            var me = this;
            me.setArea(me._copy);
            var handle = me._getHandle(me._target);
	        var i = 0;
            if(!handle){
                return false;
            }
            
            //在移动中就会清空状态,cancle
            if(me._lastHit && me._draghoverCls){
                me._lastHit.removeClass(me._draghoverCls);
                me._lastHit = null;
            }
            
            for(;i<me._items.length;i++){
                 if(me.checkCrash(me._copy.area,me._items[i].area)){
                    if(me._lastHit && me._draghoverCls){
                        me._lastHit.removeClass(me._draghoverCls);
                    }
                    if(me.checkDropEnable(me._items[i])){
                        switch(me._items[i].dndlevel - me._target.dndlevel){
                            case 0:
                                me._appendType = 'after';
                                break;
                            case -1:
                                me._appendType = 'insert';                                
                                break;
                            default:me._lastHit = null;continue;
                        }                        
                        me._items[i].addClass(handle['draghoverCls']);
                        me._draghoverCls = handle['draghoverCls'];
                        me._lastHit = me._items[i];
                        break;
                    }
                 }
            }
        },
        
        updateItem:function(){
            var handle = this._getHandle(this._target);
            if(!handle){
                return false;
            }
            if(this._target && this._lastHit){                
                if(J.type(handle['drop']) != 'function'){
                    handle['drop'] = this._defaultDrop;                    
                }
                handle['drop'].call(this,this._appendType,this._target,this._lastHit);
                this.updateArea();
            }
            if(this._lastHit && this._draghoverCls){
               this._lastHit.removeClass(this._draghoverCls);
            }
            this.setEnabled(this._target);
            this._lastHit = null;
            this._target = null;
            this._draghoverCls = '';
        },
        
        //main 
        dragabled:function(cls,handle){
            if(!cls|| !handle){
                return ;
            }
            this._clsHandlers[cls] = handle;
            if(handle['dropabled']){
                this.initDrop(cls);
            } 
            var target = J(cls).attr('data-group',cls);
            this._bindDrag(target,handle);
            if(!this._initd){
                this._bindDocEvent();
                this._initd = true;
            }
            if(handle['events']){ 
                this.bindExEvent(target,handle['events']);
            }
        },
        
        getDropItems:function(){
            return this._items;
        },
        
        bindExEvent:function(target,events){
            var handle = this._getHandle(target);
            if(!handle || !handle['events']){
                return;
            }
            if(!events){               
                events = handle['events'];
            }
            for (var i in events){
                if(J.type(events[i]) == 'function'){
                    target.bind(i,{dnd:this,handle:handle},events[i]);
                }
            }
        },
        
        _defaultDrop:function(type,target,hit){
            switch(type){
                case 'after':
                    hit.parent().after(target.parent());
                    break;
                case 'insert':
                    hit.siblings('ul').append(target.parent());                       
                    break;
            }      
        },
        
        _bindDrag:function(target,handle){
            target.bind('mousedown',{dnd:this,handle:handle},function(e){
		    if(e.button===2)return false;
                e.stopPropagation();
                e.preventDefault();
                var _this = J(this);
                var dnd =  e.data.dnd;
                dnd._timer = setTimeout(function(){
                    if(dnd._timer){
                        clearTimeout(dnd._timer);
                        dnd._timer=null;
                    }
                    var _copy = _this.clone(false);
                    var _offset = _this.position();
                    var offset ={
                        X:e.clientX - _offset.left,
                        Y:e.clientY - _offset.top
                    };
                    _this.parent().append(_copy);
                    _copy.css({
                       'position':'absolute',
                       'width':_this.width(),
                       'height':_this.height(),
                       'z-index':9999
                    }).hide();
                    if(e.data.handle['draggingCls']){
                       _copy.addClass(e.data.handle.draggingCls);
                    }
                    dnd._dragoffset = offset;
		    
		    dnd.setCurrentItem(_this,_copy);    
                    if(J.type(handle['drag']) == "function"){
                        handle['drag'].call(e.data.dnd);
                    }
                                    
                },100);//延迟100ms的好处不言而喻
                
            });
        },
        
        _bindDocEvent:function(){
             this._doc.bind('mousemove',{dnd:this},function(e){
                 e.stopPropagation();
                 //e.preventDefault();
                 var dnd = e.data.dnd;
                 if(dnd._timer){
                    clearTimeout(dnd._timer);
                    dnd._timer=null;
                 }
                 if(!dnd._copy){
                    return;
                 }
                 var offset = dnd._dragoffset;
                 dnd._copy.css({                    
                    'top':e.clientY - offset.Y,
                    'left':e.clientX - offset.X
                }).show();
                dnd.checkHit();  
            }).bind('mouseup',{dnd:this},function(e){
                e.stopPropagation();
                //e.preventDefault();
                var dnd = e.data.dnd;
                if(dnd._timer){
                    clearTimeout(dnd._timer);
                    dnd._timer=null;
                    return;
                }
                if(!dnd._copy){
                    return;
                }
                dnd._copy.remove();
                dnd.updateItem();
            });
	    
	    J(window).bind('resize',{dnd:this},function(e){
                e.data.dnd.updateArea();
            });
        },
        
        _getHandle:function(target){
            if(!target){
                return false;
            }
            return this._clsHandlers[target.attr('data-group')];
        },
        
        destory:function(){
            
        }
    };    
   
    //J.extend({},Dnd.levelsAttr[level-1])
    Dnd.levelsAttr =[
        {'icon':'<span class="label-icon label-icon-1"></span>','title':'新的一级节点','cls':'item-labelbox','expand':true},
        {'icon':'<span class="label-icon label-icon-2 expand-icon"></span>','title':'新的二级节点','cls':'item-labelbox','expand':true},
        {'icon':'<span class="label-icon label-icon-3"></span>','title':'新的三级节点','cls':'item-labelbox','expand':true},
        {'icon':'<span class="label-icon label-icon-4"></span>','title':'新的四级节点','cls':'item-labelbox','expand':true}
    ];
    
    /**
     * 
     * @param {type} level
     * @param {type} attrs
     * @param {type} ishtml // 内部使用参数
     * @returns {Boolean}
     */
    Dnd.createNewLevel = function(level,attrs,ishtml){
         ishtml = ishtml || false;
         attrs = attrs || {};
         var _attrs = {},_level=1;
         if(!isNaN(level)){
             if(!this.levelsAttr[level-1]){
                 return false;
             }
             for(i in attrs){
                 _attrs['data-'+i] = attrs[i];
             }
             _attrs['data-level'] = level;
             _level = level;
             //level = this.levelsAttr[level-1];
             level =J.extend({},this.levelsAttr[level-1]) ;
         }else{
             if(!attrs['level']){
                 return false;
             }
             var _attrs = [],i='';
             for( i in attrs){
                _attrs.push('data-'+i+'="'+attrs[i]+'"');
             }
              _level = attrs['level'];
             level['attrs'] = _attrs.join(' ');
         }
         level['level']  = _level;
         level['expand'] = level['expand']===undefined || level['expand'] ? 'block' :'none';
         delete attrs;
         var html = Dnd._newHtml.replace(/\{\#(\w+)\}/g,function(m,c){
            if(level[c]){
                return level[c];
            }else{
                return '';
            }
         });
         
         return !ishtml ? J(html).attr(_attrs) : html;
    };
    
    Dnd.render = function(data,to,options){
        if(!data){
            return false;
        }
        if(options && options['controls']){
            this._newHtml = this._newHtml.replace('{#controls}',options['controls']);
        }
        var i = 0,_h = [],_t='';
        for(;i<data.length;i++){
            _t = this._render(data[i],1);
            if(_t)_h.push(_t);
        }
        var html =  '<ul>'+_h.join('')+'</ul>';
	if(!to) return html;
        to.html(html);        
    };
    
    
    Dnd._render=function(item,level){
        if(!item ||!level) return '';
        var i='',j=0,attrs = {},_ch=[];
        item=J.extend({},Dnd.levelsAttr[level-1],item);
        for(i in item){
           if(i == 'children' && item[i]){
               for(j=0;j<item[i].length;j++){
                    _ch.push(Dnd._render(item[i][j],level+1));
               }
               item['children'] = _ch.join('');
           }
           if(i == 'attrs'){
               attrs = item[i];
           }
        }
        attrs['level'] = level;
        return Dnd.createNewLevel(item,attrs,true);
    };  
    
    J.extend(exports,Dnd)

});
