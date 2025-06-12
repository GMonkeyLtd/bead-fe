import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AuthManager } from '@/utils/auth';
import api from '@/utils/api';
import { http } from '@/utils/request';

const TestAuthPage: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('未检查');
  const [token, setToken] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  // 检查登录状态
  const checkAuthStatus = () => {
    const isLoggedIn = AuthManager.isLoggedIn();
    const authInfo = AuthManager.getAuthInfo();
    setAuthStatus(isLoggedIn ? '已登录' : '未登录');
    setToken(authInfo.token || '无token');
  };

  // 手动登录
  const handleLogin = async () => {
    try {
      Taro.showLoading({ title: '登录中...' });
      const token = await AuthManager.login();
      Taro.hideLoading();
      
      if (token) {
        Taro.showToast({ title: '登录成功', icon: 'success' });
        setToken(token);
        setAuthStatus('已登录');
      } else {
        Taro.showToast({ title: '登录失败', icon: 'error' });
      }
    } catch (error) {
      Taro.hideLoading();
      console.error('登录失败:', error);
      Taro.showToast({ title: '登录失败', icon: 'error' });
    }
  };

  // 手动退出登录
  const handleLogout = async () => {
    try {
      await AuthManager.logout();
      setAuthStatus('已退出');
      setToken('');
      setTestResult('');
    } catch (error) {
      console.error('退出失败:', error);
    }
  };

  // 测试需要认证的API
  const testAuthAPI = async () => {
    try {
      Taro.showLoading({ title: '测试中...' });
      
      // 测试八字接口（需要认证）
      const result = await api.generate.bazi({
        year: 2024,
        month: 1,
        day: 1,
        hour: 12,
        gender: 1
      });
      
      Taro.hideLoading();
      setTestResult('API调用成功: ' + JSON.stringify(result));
      Taro.showToast({ title: 'API调用成功', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      console.error('API调用失败:', error);
      setTestResult('API调用失败: ' + error.message);
      Taro.showToast({ title: 'API调用失败', icon: 'error' });
    }
  };

  // 测试不需要认证的API
  const testPublicAPI = async () => {
    try {
      Taro.showLoading({ title: '测试中...' });
      
      // 测试公开接口（跳过认证）
      const result = await http.get('/public/test', {}, { skipAuth: true });
      
      Taro.hideLoading();
      setTestResult('公开API调用成功: ' + JSON.stringify(result));
      Taro.showToast({ title: '公开API调用成功', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      console.error('公开API调用失败:', error);
      setTestResult('公开API调用失败: ' + error.message);
      Taro.showToast({ title: '公开API调用失败', icon: 'error' });
    }
  };

  // 测试自动登录（获取token）
  const testAutoLogin = async () => {
    try {
      Taro.showLoading({ title: '获取token中...' });
      
      const token = await AuthManager.getToken();
      
      Taro.hideLoading();
      setToken(token || '获取失败');
      setAuthStatus(token ? '已登录' : '未登录');
      Taro.showToast({ title: '获取token成功', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      console.error('获取token失败:', error);
      Taro.showToast({ title: '获取token失败', icon: 'error' });
    }
  };

  return (
    <View style={{ padding: '20px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
        认证系统测试
      </Text>
      
      {/* 当前状态 */}
      <View style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <Text>登录状态: {authStatus}</Text>
        <Text style={{ display: 'block', marginTop: '5px' }}>
          Token: {token ? `${token.substring(0, 20)}...` : '无'}
        </Text>
      </View>

      {/* 操作按钮 */}
      <View style={{ marginBottom: '20px' }}>
        <Button 
          onClick={checkAuthStatus}
          style={{ marginBottom: '10px' }}
        >
          检查登录状态
        </Button>
        
        <Button 
          onClick={handleLogin}
          style={{ marginBottom: '10px' }}
          type="primary"
        >
          手动登录
        </Button>
        
        <Button 
          onClick={testAutoLogin}
          style={{ marginBottom: '10px' }}
        >
          测试自动登录
        </Button>
        
        <Button 
          onClick={handleLogout}
          style={{ marginBottom: '10px' }}
        >
          退出登录
        </Button>
      </View>

      {/* API测试按钮 */}
      <View style={{ marginBottom: '20px' }}>
        <Button 
          onClick={testAuthAPI}
          style={{ marginBottom: '10px' }}
          type="primary"
        >
          测试需要认证的API
        </Button>
        
        <Button 
          onClick={testPublicAPI}
          style={{ marginBottom: '10px' }}
        >
          测试公开API
        </Button>
      </View>

      {/* 测试结果 */}
      {testResult && (
        <View style={{ 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '5px',
          wordBreak: 'break-all'
        }}>
          <Text style={{ fontSize: '14px' }}>测试结果:</Text>
          <Text style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
            {testResult}
          </Text>
        </View>
      )}
    </View>
  );
};

export default TestAuthPage; 